'use server';

/**
 * Cart mutation Server Actions (file-level `'use server'`, so it is safe to
 * import from Client Components — only action references cross the boundary).
 *
 * GUESTS vs USERS
 * ───────────────
 * The cart works whether or not you are logged in:
 *   • Signed-in  → rows in the `carts` / `cart_items` tables, keyed by user.
 *   • Guest      → an httpOnly `guest_cart` cookie (see `src/lib/guest-cart`).
 * On login/signup the guest cookie is merged into the DB cart (in `actions/auth`)
 * so nothing is lost.
 *
 * Each action resolves the current actor from the session cookie → request-time
 * (dynamic) data, never cached. Mutations call `revalidatePath('/cart')` so the
 * server-rendered cart re-reads, and return the fresh `CartVM` so clients can
 * reconcile optimistic updates. For guests, the cart-item `id` is the productId
 * (no DB row exists), which keeps the update/remove call shape identical.
 *
 * Read the cart via `src/lib/cart-data` (`getCart`).
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { loadCartByUserId } from '@/src/lib/cart-data';
import {
  pricingRoleFromUser,
  mergeCartQuantity,
  clampOrderQuantity,
  wasQuantityStockCapped,
  canUseRetailCheckout,
  type PricingRole,
} from '@/src/lib/user-role';
import {
  readGuestCart,
  writeGuestCart,
  buildGuestCartVM,
  type GuestCartLine,
} from '@/src/lib/guest-cart';
import {
  collectCartStockIssues,
  formatCartStockIssues,
} from '@/src/lib/cart-stock';
import type { CartMutationVM, CartVM } from '@/src/lib/serializers';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';

export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<ActionResult<CartMutationVM>> {
  return runMutation('addToCart', async () => {
    const qty = Math.max(1, Math.round(quantity));

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { stock: true },
    });
    if (!product) return fail('محصول یافت نشد.');
    if (product.stock < 1) return fail('این محصول موجود نیست.');

    const user = await getCurrentUser();
    const role = pricingRoleFromUser(user?.role);

    if (!user) {
      // ── Guest path: merge into the cookie cart. ──────────────────────────
      const lines = await readGuestCart();
      const existing = lines.find((l) => l.productId === productId);
      const wantedTotal = (existing?.quantity ?? 0) + qty;
      const nextQty = mergeCartQuantity(existing?.quantity ?? 0, qty, product.stock, role);
      const updated = upsertLine(lines, productId, nextQty);
      await writeGuestCart(updated);
      revalidatePath('/cart');
      revalidatePath('/dashboard/cart');
      const cart = await buildGuestCartVM(updated);
      return ok(withStockCapMeta(cart, wantedTotal, nextQty, product.stock, role));
    }

    // ── User path: persist to the DB cart. ─────────────────────────────────
    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
      select: { id: true },
    });

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
      select: { quantity: true },
    });
    const wantedTotal = (existing?.quantity ?? 0) + qty;
    const nextQty = mergeCartQuantity(existing?.quantity ?? 0, qty, product.stock, role);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: nextQty },
      update: { quantity: nextQty },
    });

    revalidatePath('/cart');
    revalidatePath('/dashboard/cart');
    const cartVm = await loadCartByUserId(user.id, role);
    return ok(withStockCapMeta(cartVm, wantedTotal, nextQty, product.stock, role));
  });
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<ActionResult<CartMutationVM>> {
  return runMutation('updateCartItemQuantity', async () => {
    const user = await getCurrentUser();

    if (!user) {
      // Guest: `itemId` is the productId.
      const lines = await readGuestCart();
      const line = lines.find((l) => l.productId === itemId);
      if (!line) return fail('آیتم سبد خرید یافت نشد.');

      const product = await prisma.product.findFirst({
        where: { id: itemId, isActive: true },
        select: { stock: true },
      });
      if (!product) return fail('محصول یافت نشد.');
      if (product.stock < 1) return fail('این محصول موجود نیست.');

      const requested = Math.round(quantity);
      const qty = clampOrderQuantity(requested, product.stock, null);
      const updated = upsertLine(lines, itemId, qty);
      await writeGuestCart(updated);
      revalidatePath('/cart');
      revalidatePath('/dashboard/cart');
      const cart = await buildGuestCartVM(updated);
      return ok(withStockCapMeta(cart, requested, qty, product.stock, null));
    }

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: user.id } },
      include: { product: { select: { stock: true } } },
    });
    if (!item) return fail('آیتم سبد خرید یافت نشد.');

    const role = pricingRoleFromUser(user.role);
    const requested = Math.round(quantity);
    const qty = clampOrderQuantity(requested, item.product.stock, role);
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: qty } });

    revalidatePath('/cart');
    revalidatePath('/dashboard/cart');
    const cartVm = await loadCartByUserId(user.id, role);
    return ok(withStockCapMeta(cartVm, requested, qty, item.product.stock, role));
  });
}

export async function removeCartItem(itemId: string): Promise<ActionResult<CartMutationVM>> {
  return runMutation('removeCartItem', async () => {
    const user = await getCurrentUser();

    if (!user) {
      // Guest: `itemId` is the productId.
      const lines = await readGuestCart();
      const updated = lines.filter((l) => l.productId !== itemId);
      await writeGuestCart(updated);
      revalidatePath('/cart');
      revalidatePath('/dashboard/cart')
      return ok(await buildGuestCartVM(updated));
    }

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: user.id } },
      select: { id: true },
    });
    if (!item) return fail('آیتم سبد خرید یافت نشد.');

    await prisma.cartItem.delete({ where: { id: itemId } });
    revalidatePath('/cart');
    return ok(await loadCartByUserId(user.id, pricingRoleFromUser(user.role)));
  });
}

export async function clearCart(): Promise<ActionResult> {
  return runMutation('clearCart', async () => {
    const user = await getCurrentUser();

    if (!user) {
      await writeGuestCart([]);
      revalidatePath('/cart');
      revalidatePath('/dashboard/cart')
      return ok(undefined);
    }

    await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
    revalidatePath('/cart');
    revalidatePath('/dashboard/cart')
    return ok(undefined);
  });
}

/**
 * Validate retail cart lines against live stock before proceeding to checkout.
 * Returns every shortfall (with remaining qty ≥ 0) in one message.
 */
export async function validateCartStockForCheckout(): Promise<ActionResult> {
  return runMutation('validateCartStockForCheckout', async () => {
    const user = await getCurrentUser();
    if (user && !canUseRetailCheckout(user.role)) {
      return ok(undefined);
    }

    let lines: { name: string; quantity: number; stock: number }[];

    if (!user) {
      const cart = await buildGuestCartVM(await readGuestCart());
      if (cart.items.length === 0) return fail('سبد خرید شما خالی است.');
      lines = cart.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        stock: i.stock,
      }));
    } else {
      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: { product: { select: { name: true, stock: true } } },
          },
        },
      });
      if (!cart || cart.items.length === 0) return fail('سبد خرید شما خالی است.');
      lines = cart.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        stock: i.product.stock,
      }));
    }

    const issues = collectCartStockIssues(lines);
    if (issues.length > 0) return fail(formatCartStockIssues(issues));
    return ok(undefined);
  });
}

/**
 * Total item count for the current actor (user or guest). Used by the header
 * cart badge, which hydrates this on mount and keeps it in sync after each
 * add-to-cart. Returns 0 on any failure so the badge never crashes the header.
 */
export async function getCartCount(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const lines = await readGuestCart();
      return lines.reduce((sum, l) => sum + l.quantity, 0);
    }
    const items = await prisma.cartItem.findMany({
      where: { cart: { userId: user.id } },
      select: { quantity: true },
    });
    return items.reduce((sum, i) => sum + i.quantity, 0);
  } catch (err) {
    console.error('[cart:getCartCount]', err);
    return 0;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function withStockCapMeta(
  cart: CartVM,
  wanted: number,
  applied: number,
  stock: number,
  role: PricingRole,
): CartMutationVM {
  if (!wasQuantityStockCapped(wanted, applied, role)) return cart;
  return { ...cart, stockCapped: true, maxStock: stock };
}

/** Return a new line list with `productId` set to `quantity` (insert or update). */
function upsertLine(
  lines: GuestCartLine[],
  productId: string,
  quantity: number,
): GuestCartLine[] {
  const found = lines.some((l) => l.productId === productId);
  if (found) {
    return lines.map((l) => (l.productId === productId ? { ...l, quantity } : l));
  }
  return [...lines, { productId, quantity }];
}
