'use server';

/**
 * Product suggestions — درخواست تأمین کالا.
 * ───────────────────────────────────────
 * Wholesale partners can propose products to stock. Each submission is stored
 * with the authenticated user id for later admin review. Restricted to
 * WHOLESALE role at both the page gate and the mutation.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { formatJalaliDateTime } from '@/src/lib/format';
import { isWholesaleUser } from '@/src/lib/user-role';
import type { ProductSuggestionVM } from '@/src/lib/dashboard-types';

const SUGGEST_PATH = '/dashboard/suggest-product';

const MAX_BODY_LENGTH = 2000;

function toVM(row: { id: string; body: string; createdAt: Date }): ProductSuggestionVM {
  return {
    id: row.id,
    body: row.body,
    date: formatJalaliDateTime(row.createdAt),
  };
}

export async function getMyProductSuggestions(): Promise<ProductSuggestionVM[]> {
  const user = await getCurrentUser();
  if (!user || !isWholesaleUser(user.role)) return [];

  return safeQuery(
    'getMyProductSuggestions',
    async () => {
      const rows = await prisma.productSuggestion.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map(toVM);
    },
    [],
  );
}

export async function submitProductSuggestion(input: {
  body: string;
}): Promise<ActionResult> {
  return runMutation('submitProductSuggestion', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای ارسال پیشنهاد وارد شوید.');
    if (!isWholesaleUser(user.role)) {
      return fail('این بخش فقط برای همکاران عمده‌فروش در دسترس است.');
    }

    const body = input.body?.trim();
    if (!body) return fail('متن پیشنهاد را وارد کنید.');
    if (body.length > MAX_BODY_LENGTH) {
      return fail(`متن پیشنهاد نباید بیشتر از ${MAX_BODY_LENGTH.toLocaleString('fa-IR')} کاراکتر باشد.`);
    }

    await prisma.productSuggestion.create({
      data: { userId: user.id, body },
    });

    revalidatePath(SUGGEST_PATH);
    return ok(undefined);
  });
}
