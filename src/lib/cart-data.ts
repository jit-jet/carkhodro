/**
 * Server-only cart data helpers.
 *
 * Kept separate from `actions/cart.ts` (a `'use server'` action module) so that
 * Server Components can import the read path without the action module — and its
 * Prisma/`pg` imports — being pulled into a Client Component bundle.
 */

import { prisma } from '@/src/lib/prisma';
import { productInclude, toCartItemVM, type CartVM } from '@/src/lib/serializers';
import { getCurrentUser } from '@/src/lib/session';
import { pricingRoleFromUser } from '@/src/lib/user-role';
import { readGuestCart, buildGuestCartVM } from '@/src/lib/guest-cart';
import type { Prisma } from '@/generated/prisma_client';

const cartArgs = {
  include: {
    items: {
      include: { product: { include: productInclude } },
      orderBy: { addedAt: 'asc' as const },
    },
  },
} satisfies Prisma.CartDefaultArgs;

type CartRow = Prisma.CartGetPayload<typeof cartArgs>;

export function buildCartVM(cart: CartRow, role = pricingRoleFromUser(null)): CartVM {
  const items = cart.items.map((item) => toCartItemVM(item, role));
  return {
    id: cart.id,
    items,
    subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

/** Load a user's cart as a view-model, or an empty cart if none exists yet. */
export async function loadCartByUserId(userId: string, role = pricingRoleFromUser(null)): Promise<CartVM> {
  const cart = await prisma.cart.findUnique({ where: { userId }, ...cartArgs });
  return cart ? buildCartVM(cart, role) : { id: '', items: [], subtotal: 0, totalItems: 0 };
}

/**
 * The current actor's cart as a view-model — never null. Signed-in users get
 * their DB cart; guests get the cart reconstructed from the `guest_cart` cookie.
 *
 * Cookie reads (`getCurrentUser`, `readGuestCart`) are intentionally kept OUTSIDE
 * the try/catch: under Cache Components, `cookies()` "suspends" during the static
 * prerender, and catching that would freeze the page in its empty shell instead
 * of streaming. Only the DB work is guarded, falling back to an empty cart so a
 * transient query failure doesn't crash the page.
 */
export async function getCart(): Promise<CartVM> {
  const user = await getCurrentUser();

  if (user) {
    try {
      return await loadCartByUserId(user.id, pricingRoleFromUser(user.role));
    } catch (err) {
      console.error('[cart:getCart:user]', err);
      return emptyCart();
    }
  }

  const lines = await readGuestCart();
  try {
    return await buildGuestCartVM(lines);
  } catch (err) {
    console.error('[cart:getCart:guest]', err);
    return emptyCart();
  }
}

function emptyCart(): CartVM {
  return { id: '', items: [], subtotal: 0, totalItems: 0 };
}
