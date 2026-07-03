'use server';

/**
 * Order survey Server Actions («نظر سنجی»).
 * ──────────────────────────────────────────
 * One satisfaction survey per order: a star rating plus checkbox selections from
 * the fixed positive / negative point lists and a free-text note. Stored keys are
 * sanitised against `survey-options` so only known options are persisted. Scoped
 * to the current user; per-user / dynamic — never cached.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { formatJalaliDateTime } from '@/src/lib/format';
import {
  sanitizePositivePoints,
  sanitizeNegativePoints,
} from '@/src/lib/survey-options';
import type { SurveyVM } from '@/src/lib/dashboard-types';

/**
 * The survey for an order — scaffolded with empty selections when the partner
 * hasn't submitted yet. Returns null only when the order is missing or not owned
 * by the caller.
 */
export async function getSurvey(orderId: string): Promise<SurveyVM | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return safeQuery(
    `getSurvey:${orderId}`,
    async () => {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
        select: { id: true, orderNumber: true, survey: true },
      });
      if (!order) return null;

      const s = order.survey;
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        rating: s?.rating ?? 0,
        positivePoints: s?.positivePoints ?? [],
        negativePoints: s?.negativePoints ?? [],
        note: s?.note ?? null,
        submittedAt: s ? formatJalaliDateTime(s.createdAt) : null,
      } satisfies SurveyVM;
    },
    null,
  );
}

export async function submitSurvey(input: {
  orderId: string;
  rating: number;
  positivePoints: string[];
  negativePoints: string[];
  note?: string;
}): Promise<ActionResult> {
  return runMutation('submitSurvey', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای ثبت نظر وارد شوید.');

    const rating = Math.round(Number(input.rating));
    if (!(rating >= 1 && rating <= 5)) return fail('لطفاً امتیاز (۱ تا ۵ ستاره) را انتخاب کنید.');

    const order = await prisma.order.findFirst({
      where: { id: input.orderId, userId: user.id },
      select: { id: true },
    });
    if (!order) return fail('فاکتور یافت نشد.');

    const positivePoints = sanitizePositivePoints(input.positivePoints ?? []);
    const negativePoints = sanitizeNegativePoints(input.negativePoints ?? []);
    const note = input.note?.trim() || null;

    await prisma.orderSurvey.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        userId: user.id,
        rating,
        positivePoints,
        negativePoints,
        note,
      },
      update: { rating, positivePoints, negativePoints, note },
    });

    revalidatePath(`/dashboard/orders/${order.id}/survey`);
    revalidatePath('/dashboard/orders');
    return ok(undefined);
  });
}
