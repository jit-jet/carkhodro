/**
 * Review reads. Cached + tagged per product (`use cache`). The write path lives
 * in `actions/review-actions.ts` (a `'use server'` module) so it can be imported
 * from Client Components without bundling Prisma.
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { toReviewVM, type ReviewVM } from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export async function getProductReviews(productId: string): Promise<ReviewVM[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.reviews(productId));

  return safeQuery(`getProductReviews:${productId}`, async () => {
    const rows = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toReviewVM);
  }, []);
}
