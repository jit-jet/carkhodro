/**
 * Pure helpers for evaluating redeemable discount codes against a cart.
 * Server actions load the DB row + usage counts, then call these functions.
 */

import type { DiscountScopeType, DiscountType } from '@/generated/prisma_client';

export interface DiscountCartLine {
  productId: string;
  categoryId: number;
  partsBrandId: number;
  /** Compatible car brand ids (via ProductCompatibility → CarModel.carBrandId). */
  carBrandIds: number[];
  /** Compatible car model ids. */
  carModelIds: number[];
  /** Net line total in Toman (after product-level % discounts). */
  lineTotal: number;
}

export interface DiscountCodeRule {
  id: string;
  code: string;
  type: DiscountType;
  value: number | null;
  startsAt: Date;
  endsAt: Date | null;
  scopeType: DiscountScopeType;
  scopeIds: string[];
  perCustomerLimit: number | null;
  totalUsageLimit: number | null;
  usedCount: number;
  minCartAmount: number | null;
  maxDiscountAmount: number | null;
  firstOrderOnly: boolean;
  minPreviousOrders: number | null;
  isActive: boolean;
}

export interface DiscountUsageContext {
  /** Prior successful orders for this user (paid / shipped / completed). */
  previousSuccessfulOrders: number;
  /** How many times this user has already redeemed this code. */
  userRedemptionCount: number;
  now?: Date;
}

export interface AppliedDiscount {
  discountCodeId: string;
  code: string;
  type: DiscountType;
  /** Toman subtracted from the order total. */
  discountAmount: number;
  /** Eligible merchandise subtotal the code was applied against. */
  eligibleSubtotal: number;
}

export type DiscountEvalResult =
  | { ok: true; data: AppliedDiscount }
  | { ok: false; error: string };

function isProductInScope(
  line: DiscountCartLine,
  scopeType: DiscountScopeType,
  scopeIds: string[],
): boolean {
  if (scopeIds.length === 0) return true;
  if (scopeType === 'PRODUCT') return scopeIds.includes(line.productId);
  if (scopeType === 'CATEGORY') return scopeIds.includes(String(line.categoryId));
  if (scopeType === 'BRAND') return scopeIds.includes(String(line.partsBrandId));
  if (scopeType === 'CAR_BRAND') {
    return line.carBrandIds.some((id) => scopeIds.includes(String(id)));
  }
  if (scopeType === 'CAR_MODEL') {
    return line.carModelIds.some((id) => scopeIds.includes(String(id)));
  }
  return false;
}

export function eligibleSubtotal(
  lines: DiscountCartLine[],
  scopeType: DiscountScopeType,
  scopeIds: string[],
): number {
  return lines
    .filter((l) => isProductInScope(l, scopeType, scopeIds))
    .reduce((sum, l) => sum + l.lineTotal, 0);
}

/**
 * Validate a discount-code rule against cart lines + usage context and compute
 * the Toman discount amount. Does not touch the database.
 */
export function evaluateDiscountCode(
  rule: DiscountCodeRule,
  lines: DiscountCartLine[],
  shippingCost: number,
  cartSubtotal: number,
  usage: DiscountUsageContext,
): DiscountEvalResult {
  const now = usage.now ?? new Date();

  if (!rule.isActive) {
    return { ok: false, error: 'این کد تخفیف غیرفعال است.' };
  }
  if (rule.startsAt.getTime() > now.getTime()) {
    return { ok: false, error: 'زمان استفاده از این کد هنوز شروع نشده است.' };
  }
  if (rule.endsAt && rule.endsAt.getTime() < now.getTime()) {
    return { ok: false, error: 'مهلت استفاده از این کد به پایان رسیده است.' };
  }
  if (rule.totalUsageLimit != null && rule.usedCount >= rule.totalUsageLimit) {
    return { ok: false, error: 'سقف استفاده از این کد تکمیل شده است.' };
  }
  if (
    rule.perCustomerLimit != null &&
    usage.userRedemptionCount >= rule.perCustomerLimit
  ) {
    return { ok: false, error: 'شما قبلاً از سقف مجاز این کد استفاده کرده‌اید.' };
  }
  if (rule.firstOrderOnly && usage.previousSuccessfulOrders > 0) {
    return { ok: false, error: 'این کد فقط برای اولین سفارش قابل استفاده است.' };
  }
  if (
    rule.minPreviousOrders != null &&
    usage.previousSuccessfulOrders < rule.minPreviousOrders
  ) {
    return {
      ok: false,
      error: `برای استفاده از این کد حداقل ${rule.minPreviousOrders} سفارش موفق قبلی لازم است.`,
    };
  }
  if (rule.minCartAmount != null && cartSubtotal < rule.minCartAmount) {
    return {
      ok: false,
      error: `حداقل مبلغ سبد خرید برای این کد ${rule.minCartAmount.toLocaleString('fa-IR')} تومان است.`,
    };
  }

  const eligible = eligibleSubtotal(lines, rule.scopeType, rule.scopeIds);
  if (eligible <= 0) {
    return {
      ok: false,
      error: 'این کد تخفیف شامل محصولات سبد خرید شما نمی‌شود.',
    };
  }

  let discountAmount = 0;

  if (rule.type === 'FREE_SHIPPING') {
    if (shippingCost <= 0) {
      return { ok: false, error: 'هزینه ارسالی برای اعمال ارسال رایگان وجود ندارد.' };
    }
    discountAmount = shippingCost;
  } else if (rule.type === 'PERCENTAGE') {
    const pct = rule.value ?? 0;
    if (pct <= 0 || pct > 100) {
      return { ok: false, error: 'مقدار کد تخفیف نامعتبر است.' };
    }
    discountAmount = Math.floor((eligible * pct) / 100);
    if (rule.maxDiscountAmount != null) {
      discountAmount = Math.min(discountAmount, rule.maxDiscountAmount);
    }
  } else if (rule.type === 'FIXED_AMOUNT') {
    const amount = rule.value ?? 0;
    if (amount <= 0) {
      return { ok: false, error: 'مقدار کد تخفیف نامعتبر است.' };
    }
    discountAmount = Math.min(Math.floor(amount), eligible);
  } else {
    return { ok: false, error: 'نوع کد تخفیف نامعتبر است.' };
  }

  discountAmount = Math.max(0, Math.min(discountAmount, cartSubtotal + shippingCost));
  if (discountAmount <= 0) {
    return { ok: false, error: 'مبلغ تخفیف قابل اعمال نیست.' };
  }

  return {
    ok: true,
    data: {
      discountCodeId: rule.id,
      code: rule.code,
      type: rule.type,
      discountAmount,
      eligibleSubtotal: eligible,
    },
  };
}
