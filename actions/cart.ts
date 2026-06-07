'use server';

/**
 * Cart mutation Server Actions (file-level `'use server'`, so it is safe to
 * import from Client Components — only action references cross the boundary).
 *
 * The cart is per-user and resolved from the session cookie → request-time
 * (dynamic) data, never cached. Each mutation calls `revalidatePath('/cart')`
 * so the server-rendered cart re-reads, and returns the fresh cart so clients
 * can reconcile optimistic updates. Read the cart via `src/lib/cart-data`.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { loadCartByUserId } from '@/src/lib/cart-data';
import type { CartVM } from '@/src/lib/serializers';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';

export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<ActionResult<CartVM>> {
  return runMutation('addToCart', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای افزودن به سبد خرید ابتدا وارد شوید.');

    const qty = Math.max(1, Math.round(quantity));
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { stock: true },
    });
    if (!product) return fail('محصول یافت نشد.');
    if (product.stock < 1) return fail('این محصول موجود نیست.');

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
    const nextQty = Math.min(product.stock, (existing?.quantity ?? 0) + qty);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: nextQty },
      update: { quantity: nextQty },
    });

    revalidatePath('/cart');
    return ok(await loadCartByUserId(user.id));
  });
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<ActionResult<CartVM>> {
  return runMutation('updateCartItemQuantity', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: user.id } },
      include: { product: { select: { stock: true } } },
    });
    if (!item) return fail('آیتم سبد خرید یافت نشد.');

    const qty = Math.max(1, Math.min(item.product.stock, Math.round(quantity)));
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: qty } });

    revalidatePath('/cart');
    return ok(await loadCartByUserId(user.id));
  });
}

export async function removeCartItem(itemId: string): Promise<ActionResult<CartVM>> {
  return runMutation('removeCartItem', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: user.id } },
      select: { id: true },
    });
    if (!item) return fail('آیتم سبد خرید یافت نشد.');

    await prisma.cartItem.delete({ where: { id: itemId } });
    revalidatePath('/cart');
    return ok(await loadCartByUserId(user.id));
  });
}

export async function clearCart(): Promise<ActionResult> {
  return runMutation('clearCart', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');

    await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
    revalidatePath('/cart');
    return ok(undefined);
  });
}
