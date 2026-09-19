'use server';

import { prisma } from '@/src/lib/prisma';
import { getCurrentUser } from '@/src/lib/session';

/** Record an actual product-page visit, never a guest or staff request. */
export async function recordSignedInProductVisit(productId: string): Promise<void> {
  if (typeof productId !== 'string' || !productId) return;

  const user = await getCurrentUser();
  if (!user || (user.role !== 'RETAIL' && user.role !== 'WHOLESALE')) return;

  try {
    await prisma.productVisit.create({ data: { userId: user.id, productId } });
  } catch (error) {
    // Analytics must never interrupt browsing (including during a pending migration).
    console.error('[product-visits:record]', error);
  }
}
