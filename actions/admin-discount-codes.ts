'use server';

/**
 * Discount-code mutation Server Actions — admin panel.
 * Split from `actions/discount-codes.ts` so Client Components can import writes
 * without pulling read helpers into the browser bundle.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';
import type { DiscountScopeType, DiscountType } from '@/generated/prisma_client';

export interface DiscountCodeInput {
  code: string;
  type: DiscountType;
  value: number | null;
  startsAt: string;
  endsAt: string | null;
  scopeType: DiscountScopeType;
  scopeIds: string[];
  perCustomerLimit: number | null;
  totalUsageLimit: number | null;
  minCartAmount: number | null;
  maxDiscountAmount: number | null;
  firstOrderOnly: boolean;
  minPreviousOrders: number | null;
  isActive: boolean;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

function parseOptionalInt(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function parseOptionalAmount(n: number | null | undefined): bigint | null {
  if (n == null || !Number.isFinite(n) || n < 0) return null;
  return BigInt(Math.floor(n));
}

function validateInput(input: DiscountCodeInput): string | null {
  const code = normalizeCode(input.code);
  if (!code) return 'کد تخفیف الزامی است.';
  if (code.length < 2) return 'کد تخفیف باید حداقل ۲ کاراکتر باشد.';
  if (code.length > 40) return 'کد تخفیف نباید بیشتر از ۴۰ کاراکتر باشد.';
  if (!/^[A-Z0-9_-]+$/i.test(code)) {
    return 'کد تخفیف فقط می‌تواند شامل حروف، عدد، خط تیره و زیرخط باشد.';
  }

  if (!input.startsAt) return 'زمان شروع الزامی است.';
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) return 'زمان شروع نامعتبر است.';

  let endsAt: Date | null = null;
  if (input.endsAt) {
    endsAt = new Date(input.endsAt);
    if (Number.isNaN(endsAt.getTime())) return 'زمان پایان نامعتبر است.';
    if (endsAt <= startsAt) return 'زمان پایان باید بعد از زمان شروع باشد.';
  }

  if (input.type === 'PERCENTAGE') {
    if (input.value == null || !Number.isFinite(input.value)) {
      return 'مقدار تخفیف درصدی الزامی است.';
    }
    if (input.value <= 0 || input.value > 100) {
      return 'مقدار تخفیف درصدی باید بین ۰ تا ۱۰۰ باشد.';
    }
  } else if (input.type === 'FIXED_AMOUNT') {
    if (input.value == null || !Number.isFinite(input.value) || input.value <= 0) {
      return 'مبلغ تخفیف باید بزرگ‌تر از صفر باشد.';
    }
  }

  if (
    input.perCustomerLimit != null &&
    input.totalUsageLimit != null &&
    input.perCustomerLimit > input.totalUsageLimit
  ) {
    return 'محدودیت هر مشتری نمی‌تواند از محدودیت کل بیشتر باشد.';
  }

  if (input.firstOrderOnly && input.minPreviousOrders != null && input.minPreviousOrders > 0) {
    return '«فقط اولین سفارش» با حداقل سفارش قبلی همزمان قابل تنظیم نیست.';
  }

  return null;
}

function toDbData(input: DiscountCodeInput) {
  const code = normalizeCode(input.code);
  const startsAt = new Date(input.startsAt);
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  const value =
    input.type === 'FREE_SHIPPING'
      ? null
      : input.value == null
        ? null
        : input.value;

  return {
    code,
    type: input.type,
    value,
    startsAt,
    endsAt,
    scopeType: input.scopeType,
    scopeIds: [...new Set(input.scopeIds.map((id) => String(id).trim()).filter(Boolean))],
    perCustomerLimit: parseOptionalInt(input.perCustomerLimit),
    totalUsageLimit: parseOptionalInt(input.totalUsageLimit),
    minCartAmount: parseOptionalAmount(input.minCartAmount),
    maxDiscountAmount: parseOptionalAmount(input.maxDiscountAmount),
    firstOrderOnly: Boolean(input.firstOrderOnly),
    minPreviousOrders: input.firstOrderOnly
      ? null
      : parseOptionalInt(input.minPreviousOrders),
    isActive: input.isActive !== false,
  };
}

export async function createDiscountCode(
  input: DiscountCodeInput,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('createDiscountCode', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');

    const validationError = validateInput(input);
    if (validationError) return fail(validationError);

    const data = toDbData(input);
    const existing = await prisma.discountCode.findUnique({
      where: { code: data.code },
      select: { id: true },
    });
    if (existing) return fail('این کد تخفیف قبلاً ثبت شده است.');

    const created = await prisma.discountCode.create({
      data,
      select: { id: true },
    });
    updateTag(tags.discountCodes);
    return ok(created);
  });
}

export async function updateDiscountCode(
  id: string,
  input: DiscountCodeInput,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('updateDiscountCode', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');
    if (!id) return fail('شناسه کد تخفیف نامعتبر است.');

    const validationError = validateInput(input);
    if (validationError) return fail(validationError);

    const data = toDbData(input);
    const conflict = await prisma.discountCode.findFirst({
      where: { code: data.code, NOT: { id } },
      select: { id: true },
    });
    if (conflict) return fail('این کد تخفیف قبلاً ثبت شده است.');

    const updated = await prisma.discountCode.update({
      where: { id },
      data,
      select: { id: true },
    });
    updateTag(tags.discountCodes);
    return ok(updated);
  });
}

export async function deleteDiscountCode(id: string): Promise<ActionResult> {
  return runMutation('deleteDiscountCode', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');
    if (!id) return fail('شناسه کد تخفیف نامعتبر است.');

    await prisma.discountCode.delete({ where: { id } });
    updateTag(tags.discountCodes);
    return ok(undefined);
  });
}

export async function setDiscountCodeActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  return runMutation('setDiscountCodeActive', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');
    if (!id) return fail('شناسه کد تخفیف نامعتبر است.');

    await prisma.discountCode.update({
      where: { id },
      data: { isActive },
    });
    updateTag(tags.discountCodes);
    return ok(undefined);
  });
}

/** Lightweight product search for the discount-code scope picker (admin form). */
export async function searchProductsForDiscount(
  query: string,
  limit = 12,
): Promise<{ id: string; label: string }[]> {
  const admin = await getCurrentAdmin();
  if (!admin) return [];

  const q = query.trim();
  if (q.length < 1) return [];

  try {
    const rows = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, sku: true },
      orderBy: { name: 'asc' },
      take: Math.min(30, Math.max(1, limit)),
    });
    return rows.map((r) => ({ id: r.id, label: `${r.name} (${r.sku})` }));
  } catch (err) {
    console.error('[searchProductsForDiscount]', err);
    return [];
  }
}
