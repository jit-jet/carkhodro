'use server';

/**
 * Storefront + wholesale discount-code preview and shared checkout resolution.
 * File-level `'use server'` so Client Components can call preview helpers
 * without pulling Prisma into the browser bundle.
 */

import { prisma } from '@/src/lib/prisma';
import { getCurrentUser } from '@/src/lib/session';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { resolveProductPriceBigInt, netLineTotalBigInt } from '@/src/lib/pricing';
import type { ProductPriceFields } from '@/src/lib/pricing';
import {
  pricingRoleFromUser,
  canUseRetailCheckout,
  canUseDashboardCart,
} from '@/src/lib/user-role';
import {
  evaluateDiscountCode,
  type AppliedDiscount,
  type DiscountCartLine,
  type DiscountCodeRule,
} from '@/src/lib/apply-discount-code';
import type { DiscountCode, OrderStatus, PaymentStatus, Prisma, UserRole } from '@/generated/prisma_client';

const SUCCESSFUL_STATUSES: OrderStatus[] = ['PAID', 'SHIPPED', 'COMPLETED'];
const ACTIVE_REDEMPTION_PAYMENT: PaymentStatus[] = ['PENDING', 'PAID'];

const DISCOUNT_PRODUCT_SELECT = {
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
} as const;

type DiscountProductRow = {
  id: string;
  categoryId: number;
  partsBrandId: number;
  wholesalePrice: ProductPriceFields['wholesalePrice'];
  wholesaleDiscountPct: ProductPriceFields['wholesaleDiscountPct'];
  retailPriceDiffPct: ProductPriceFields['retailPriceDiffPct'];
  retailDiscountPct: ProductPriceFields['retailDiscountPct'];
  compatibilities: { carModelId: number; carModel: { carBrandId: number } }[];
};

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
    targetUserType: row.targetUserType,
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

async function loadUsageContext(
  userId: string,
  discountCodeId: string,
  userRole: UserRole | null,
) {
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
  return { previousSuccessfulOrders, userRedemptionCount, userRole };
}

function buildDiscountLines(
  items: {
    quantity: number;
    product: DiscountProductRow;
  }[],
  role: UserRole | null,
): DiscountCartLine[] {
  return items.map((item) => {
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
}

export interface PreviewDiscountResult {
  code: string;
  type: AppliedDiscount['type'];
  discountAmount: number;
  eligibleSubtotal: number;
}

/**
 * Preview a discount code against the current user's cart.
 * Retail checkout must pass an active `shippingOptionId`.
 * Wholesale invoice cart uses shipping cost 0 (pass `null` / omit).
 */
export async function previewDiscountCode(
  code: string,
  shippingOptionId?: string | null,
): Promise<ActionResult<PreviewDiscountResult>> {
  return runMutation('previewDiscountCode', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای استفاده از کد تخفیف وارد شوید.');

    const wholesale = canUseDashboardCart(user.role);
    const retail = canUseRetailCheckout(user.role);
    if (!wholesale && !retail) {
      return fail('امکان استفاده از کد تخفیف برای این حساب وجود ندارد.');
    }

    const normalized = code.trim().toUpperCase();
    if (!normalized) return fail('کد تخفیف را وارد کنید.');

    const cartPromise = prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: { select: DISCOUNT_PRODUCT_SELECT },
          },
        },
      },
    });

    const [row, cart, shipping] = await Promise.all([
      prisma.discountCode.findUnique({ where: { code: normalized } }),
      cartPromise,
      wholesale
        ? Promise.resolve(null)
        : shippingOptionId
          ? prisma.shippingOption.findUnique({ where: { id: shippingOptionId } })
          : Promise.resolve(null),
    ]);

    if (!row) return fail('کد تخفیف یافت نشد.');
    if (!cart || cart.items.length === 0) return fail('سبد خرید شما خالی است.');

    let shippingCost = 0;
    if (!wholesale) {
      if (!shippingOptionId) return fail('ابتدا روش ارسال را انتخاب کنید.');
      if (!shipping || !shipping.isActive) return fail('روش ارسال معتبر نیست.');
      shippingCost = Number(shipping.cost);
    }

    const role = pricingRoleFromUser(user.role);
    const lines = buildDiscountLines(cart.items, role);
    const cartSubtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const usage = await loadUsageContext(user.id, row.id, user.role);
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
 * Resolve + validate a code during checkout / invoice submit.
 * Returns null when no code was provided; otherwise an AppliedDiscount or fail.
 */
export async function resolveDiscountForCheckout(
  code: string | null | undefined,
  lines: DiscountCartLine[],
  shippingCost: bigint,
  cartSubtotal: bigint,
  userId: string,
  userRole: UserRole,
): Promise<ActionResult<AppliedDiscount | null>> {
  const normalized = (code ?? '').trim().toUpperCase();
  if (!normalized) return ok(null);

  const row = await prisma.discountCode.findUnique({ where: { code: normalized } });
  if (!row) return fail('کد تخفیف یافت نشد.');

  const usage = await loadUsageContext(userId, row.id, userRole);
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
