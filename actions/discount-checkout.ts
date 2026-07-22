'use server';

/**
 * Storefront discount-code preview + shared resolution used by checkout.
 * File-level `'use server'` so Client Components can call `previewDiscountCode`
 * without pulling Prisma into the browser bundle.
 */

import { prisma } from '@/src/lib/prisma';
import { getCurrentUser } from '@/src/lib/session';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { resolveProductPriceBigInt, netLineTotalBigInt } from '@/src/lib/pricing';
import { pricingRoleFromUser, canUseRetailCheckout } from '@/src/lib/user-role';
import {
  evaluateDiscountCode,
  type AppliedDiscount,
  type DiscountCartLine,
  type DiscountCodeRule,
} from '@/src/lib/apply-discount-code';
import type { DiscountCode, OrderStatus, PaymentStatus, Prisma } from '@/generated/prisma_client';

const SUCCESSFUL_STATUSES: OrderStatus[] = ['PAID', 'SHIPPED', 'COMPLETED'];
const ACTIVE_REDEMPTION_PAYMENT: PaymentStatus[] = ['PENDING', 'PAID'];

function toRule(row: DiscountCode): DiscountCodeRule {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value == null ? null : Number(row.value),
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    scopeType: row.scopeType,
    scopeIds: row.scopeIds,
    perCustomerLimit: row.perCustomerLimit,
    totalUsageLimit: row.totalUsageLimit,
    usedCount: row.usedCount,
    minCartAmount: row.minCartAmount == null ? null : Number(row.minCartAmount),
    maxDiscountAmount: row.maxDiscountAmount == null ? null : Number(row.maxDiscountAmount),
    firstOrderOnly: row.firstOrderOnly,
    minPreviousOrders: row.minPreviousOrders,
    isActive: row.isActive,
  };
}

async function loadUsageContext(userId: string, discountCodeId: string) {
  const [previousSuccessfulOrders, userRedemptionCount] = await Promise.all([
    prisma.order.count({
      where: {
        userId,
        status: { in: SUCCESSFUL_STATUSES },
        paymentStatus: 'PAID',
      },
    }),
    prisma.order.count({
      where: {
        userId,
        discountCodeId,
        paymentStatus: { in: ACTIVE_REDEMPTION_PAYMENT },
        status: {
          notIn: ['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_MANAGER'],
        },
      },
    }),
  ]);
  return { previousSuccessfulOrders, userRedemptionCount };
}

export interface PreviewDiscountResult {
  code: string;
  type: AppliedDiscount['type'];
  discountAmount: number;
  eligibleSubtotal: number;
}

/**
 * Preview a discount code against the current user's cart (retail checkout).
 */
export async function previewDiscountCode(
  code: string,
  shippingOptionId: string,
): Promise<ActionResult<PreviewDiscountResult>> {
  return runMutation('previewDiscountCode', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای استفاده از کد تخفیف وارد شوید.');
    if (!canUseRetailCheckout(user.role)) {
      return fail('کد تخفیف فقط در تسویه فروشگاهی قابل استفاده است.');
    }

    const normalized = code.trim().toUpperCase();
    if (!normalized) return fail('کد تخفیف را وارد کنید.');

    const [row, cart, shipping] = await Promise.all([
      prisma.discountCode.findUnique({ where: { code: normalized } }),
      prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  categoryId: true,
                  partsBrandId: true,
                  wholesalePrice: true,
                  wholesaleDiscountPct: true,
                  retailPriceDiffPct: true,
                  retailDiscountPct: true,
                  compatibilities: {
                    select: {
                      carModelId: true,
                      carModel: { select: { carBrandId: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.shippingOption.findUnique({ where: { id: shippingOptionId } }),
    ]);

    if (!row) return fail('کد تخفیف یافت نشد.');
    if (!cart || cart.items.length === 0) return fail('سبد خرید شما خالی است.');
    if (!shipping || !shipping.isActive) return fail('روش ارسال معتبر نیست.');

    const role = pricingRoleFromUser(user.role);
    const lines: DiscountCartLine[] = cart.items.map((item) => {
      const pricing = resolveProductPriceBigInt(
        {
          wholesalePrice: item.product.wholesalePrice,
          wholesaleDiscountPct: item.product.wholesaleDiscountPct,
          retailPriceDiffPct: item.product.retailPriceDiffPct,
          retailDiscountPct: item.product.retailDiscountPct,
        },
        role,
      );
      const carModelIds = item.product.compatibilities.map((c) => c.carModelId);
      const carBrandIds = [
        ...new Set(item.product.compatibilities.map((c) => c.carModel.carBrandId)),
      ];
      return {
        productId: item.product.id,
        categoryId: item.product.categoryId,
        partsBrandId: item.product.partsBrandId,
        carBrandIds,
        carModelIds,
        lineTotal: Number(
          netLineTotalBigInt(pricing.basePrice, item.quantity, pricing.discountPct),
        ),
      };
    });

    const cartSubtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const shippingCost = Number(shipping.cost);
    const usage = await loadUsageContext(user.id, row.id);
    const evaluated = evaluateDiscountCode(
      toRule(row),
      lines,
      shippingCost,
      cartSubtotal,
      usage,
    );
    if (!evaluated.ok) return fail(evaluated.error);

    return ok({
      code: evaluated.data.code,
      type: evaluated.data.type,
      discountAmount: evaluated.data.discountAmount,
      eligibleSubtotal: evaluated.data.eligibleSubtotal,
    });
  });
}

/**
 * Resolve + validate a code during `submitCheckout`. Returns null when no code
 * was provided; otherwise an AppliedDiscount or a fail result.
 */
export async function resolveDiscountForCheckout(
  code: string | null | undefined,
  lines: DiscountCartLine[],
  shippingCost: bigint,
  cartSubtotal: bigint,
  userId: string,
): Promise<ActionResult<AppliedDiscount | null>> {
  const normalized = (code ?? '').trim().toUpperCase();
  if (!normalized) return ok(null);

  const row = await prisma.discountCode.findUnique({ where: { code: normalized } });
  if (!row) return fail('کد تخفیف یافت نشد.');

  const usage = await loadUsageContext(userId, row.id);
  const evaluated = evaluateDiscountCode(
    toRule(row),
    lines,
    Number(shippingCost),
    Number(cartSubtotal),
    usage,
  );
  if (!evaluated.ok) return fail(evaluated.error);
  return ok(evaluated.data);
}

/** Increment usedCount inside an existing transaction after order create. */
export async function incrementDiscountUsage(
  tx: Prisma.TransactionClient,
  discountCodeId: string,
): Promise<void> {
  await tx.discountCode.update({
    where: { id: discountCodeId },
    data: { usedCount: { increment: 1 } },
  });
}
