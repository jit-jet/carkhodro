'use server';

/**
 * Review mutation Server Action (file-level `'use server'`, importable from the
 * Client PDP comment form).
 *
 * Creating a review recomputes the product's denormalized `ratingAvg` /
 * `reviewCount` in a transaction, then invalidates the review list and product
 * caches with `updateTag` so the author immediately sees their own review.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { toReviewVM, type ReviewVM } from '@/src/lib/serializers';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { tags } from '@/actions/cache-tags';

export interface ReviewInput {
  productId: string;
  authorName: string;
  rating: number;
  text: string;
}

export async function createReview(
  input: ReviewInput,
): Promise<ActionResult<ReviewVM>> {
  return runMutation('createReview', async () => {
    const author = input.authorName?.trim();
    const text = input.text?.trim();
    const rating = Math.round(Number(input.rating));

    if (!author) return fail('نام خود را وارد کنید.');
    if (!(rating >= 1 && rating <= 5)) return fail('امتیاز باید بین ۱ تا ۵ باشد.');
    if (!text) return fail('متن نظر را وارد کنید.');

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true },
    });
    if (!product) return fail('محصول یافت نشد.');

    // Verified-purchase badge: a logged-in user with a delivered order line.
    const user = await getCurrentUser();
    let isVerifiedPurchase = false;
    if (user) {
      const purchased = await prisma.orderItem.findFirst({
        where: {
          productId: input.productId,
          order: { userId: user.id, status: 'COMPLETED' },
        },
        select: { id: true },
      });
      isVerifiedPurchase = purchased !== null;
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId: input.productId,
          userId: user?.id ?? null,
          authorName: author,
          rating,
          text,
          isVerifiedPurchase,
        },
      });

      const agg = await tx.review.aggregate({
        where: { productId: input.productId },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await tx.product.update({
        where: { id: input.productId },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          reviewCount: agg._count._all,
        },
      });

      return created;
    });

    updateTag(tags.reviews(input.productId));
    updateTag(tags.product(input.productId));
    updateTag(tags.products);

    return ok(toReviewVM(review));
  });
}
