import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';

/** Remove all items from a user's cart — called after a completed checkout. */
export async function clearUserCart(userId: string): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
  revalidatePath('/cart');
  revalidatePath('/dashboard/cart')
  revalidatePath('/checkout');
}
