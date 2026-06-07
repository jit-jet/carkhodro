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

export function buildCartVM(cart: CartRow): CartVM {
  const items = cart.items.map(toCartItemVM);
  return {
    id: cart.id,
    items,
    subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

/** Load a user's cart as a view-model, or an empty cart if none exists yet. */
export async function loadCartByUserId(userId: string): Promise<CartVM> {
  const cart = await prisma.cart.findUnique({ where: { userId }, ...cartArgs });
  return cart ? buildCartVM(cart) : { id: '', items: [], subtotal: 0, totalItems: 0 };
}

/** Current user's cart, or null when signed out. */
export async function getCart(): Promise<CartVM | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    return await loadCartByUserId(user.id);
  } catch (err) {
    console.error('[cart:getCart]', err);
    return null;
  }
}
