/**
 * Guest cart — server-only.
 * ─────────────────────────
 * Lets a signed-out visitor build a cart that survives navigations and reloads.
 * The cart lives in an httpOnly `guest_cart` cookie (so it is never tampered
 * with client-side; all reads/writes go through the cart Server Actions). Each
 * entry is just `{ productId, quantity }` — product details (name, price,
 * stock, image) are always re-read live from the DB so a guest never sees a
 * stale price.
 *
 * On login/signup the guest cart is merged into the user's persistent DB cart
 * (`mergeGuestCartIntoUser`) and the cookie is cleared.
 *
 * NOTE on cookies: reading (`readGuestCart`) is safe in Server Components and
 * Server Actions; writing (`writeGuestCart` / `clearGuestCart` / the merge) must
 * only happen inside a Server Action or Route Handler.
 */

import { cookies } from 'next/headers';
import { prisma } from '@/src/lib/prisma';
import { productInclude, toCartItemVM, type CartVM } from '@/src/lib/serializers';

export const GUEST_CART_COOKIE = 'guest_cart';
const GUEST_CART_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
/** Defensive cap so a crafted cookie can't blow up a query. */
const MAX_GUEST_LINES = 50;

export interface GuestCartLine {
  productId: string;
  quantity: number;
}

// ── Cookie read / write ──────────────────────────────────────────────────────

/** Parse the guest cart cookie into clean lines (never throws). */
export async function readGuestCart(): Promise<GuestCartLine[]> {
  const raw = (await cookies()).get(GUEST_CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is GuestCartLine =>
          l && typeof l.productId === 'string' && Number.isFinite(l.quantity),
      )
      .map((l) => ({ productId: l.productId, quantity: Math.max(1, Math.round(l.quantity)) }))
      .slice(0, MAX_GUEST_LINES);
  } catch {
    return [];
  }
}

/** Persist guest cart lines back to the cookie (Server Action context only). */
export async function writeGuestCart(lines: GuestCartLine[]): Promise<void> {
  const store = await cookies();
  if (lines.length === 0) {
    store.delete(GUEST_CART_COOKIE);
    return;
  }
  store.set(GUEST_CART_COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production',  // uncomment later
    sameSite: 'lax',
    expires: new Date(Date.now() + GUEST_CART_TTL_MS),
    path: '/',
  });
}

/** Remove the guest cart cookie (e.g. after merging into a user cart). */
export async function clearGuestCart(): Promise<void> {
  (await cookies()).delete(GUEST_CART_COOKIE);
}

// ── View-model ───────────────────────────────────────────────────────────────

/**
 * Build a `CartVM` from guest lines, reading live product data. Inactive or
 * deleted products are dropped; quantities are capped at current stock. The
 * resulting item `id` is the productId (guests have no DB cart-item rows), which
 * keeps the same update/remove call shape the cart UI already uses.
 */
export async function buildGuestCartVM(lines: GuestCartLine[]): Promise<CartVM> {
  if (lines.length === 0) return emptyCart();

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, isActive: true },
    include: productInclude,
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items = lines
    .map((line) => {
      const product = byId.get(line.productId);
      if (!product || product.stock < 1) return null;
      const quantity = Math.min(product.stock, line.quantity);
      // Reuse the shared serializer; item id === productId for guests.
      return toCartItemVM({ id: product.id, productId: product.id, quantity, product });
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  return {
    id: 'guest',
    items,
    subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

/** Current guest cart as a view-model (empty when the cookie is absent). */
export async function getGuestCartVM(): Promise<CartVM> {
  return buildGuestCartVM(await readGuestCart());
}

function emptyCart(): CartVM {
  return { id: 'guest', items: [], subtotal: 0, totalItems: 0 };
}

// ── Merge on login ───────────────────────────────────────────────────────────

/**
 * Fold the guest cart into the user's DB cart, then clear the cookie. Called
 * from the auth actions right after a session is created. Quantities are summed
 * and capped at stock; the guest's cookie is always cleared afterwards so the
 * two carts can't double-count on a later visit.
 */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const lines = await readGuestCart();
  if (lines.length === 0) return;

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: lines.map((l) => l.productId) }, isActive: true },
      select: { id: true, stock: true },
    });
    const stockById = new Map(products.map((p) => [p.id, p.stock]));

    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });

    for (const line of lines) {
      const stock = stockById.get(line.productId);
      if (stock == null || stock < 1) continue;

      const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: line.productId } },
        select: { quantity: true },
      });
      const nextQty = Math.min(stock, (existing?.quantity ?? 0) + line.quantity);

      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: line.productId } },
        create: { cartId: cart.id, productId: line.productId, quantity: nextQty },
        update: { quantity: nextQty },
      });
    }
  } catch (err) {
    console.error('[guest-cart:mergeGuestCartIntoUser]', err);
  } finally {
    await clearGuestCart();
  }
}
