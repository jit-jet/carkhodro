/**
 * Product pricing — wholesale vs retail tiers.
 * ───────────────────────────────────────────
 * Wholesale:
 *   wholesalePrice → apply wholesaleDiscountPct → wholesaleFinal
 *
 * Retail:
 *   wholesalePrice → apply retailPriceDiffPct → retailPrice (list)
 *   retailPrice → apply retailDiscountPct → retailFinal
 *
 * All amounts are Toman, matching the rest of the app.
 */

import type { Prisma } from '@/generated/prisma_client';
import { isWholesaleUser, type PricingRole } from '@/src/lib/user-role';

export interface ProductPriceFields {
  wholesalePrice: bigint | number;
  wholesaleDiscountPct: number | Prisma.Decimal;
  retailPriceDiffPct: number | Prisma.Decimal;
  retailDiscountPct: number | Prisma.Decimal;
}

/** Resolved display / checkout price for a user role. */
export interface ResolvedPrice {
  /** List price before discount (crossed out in UI when discount > 0). */
  basePrice: number;
  /** Active discount percent (0–100). */
  discountPct: number;
  /** Payable unit price after discount. */
  finalPrice: number;
}

function pct(value: number | Prisma.Decimal): number {
  return Number(value);
}

function toNumber(amount: bigint | number): number {
  return typeof amount === 'bigint' ? Number(amount) : amount;
}

/**
 * retailPrice = wholesalePrice × (1 + retailPriceDiffPct / 100)
 *
 * Retail prices always round up to the next whole Toman so the storefront,
 * cart and checkout never undercut the configured percentage.
 */
export function computeRetailPrice(fields: ProductPriceFields): number {
  const wholesale = toNumber(fields.wholesalePrice);
  const diff = pct(fields.retailPriceDiffPct);
  return Math.ceil((wholesale * (100 + diff)) / 100);
}

/** wholesaleFinal = wholesalePrice × (1 − wholesaleDiscountPct / 100) */
export function computeWholesaleFinal(fields: ProductPriceFields): number {
  const wholesale = toNumber(fields.wholesalePrice);
  const discount = pct(fields.wholesaleDiscountPct);
  return applyDiscount(wholesale, discount);
}

/** retailFinal = retailPrice × (1 − retailDiscountPct / 100) */
export function computeRetailFinal(fields: ProductPriceFields): number {
  const retail = computeRetailPrice(fields);
  const discount = pct(fields.retailDiscountPct);
  return applyRetailDiscount(retail, discount);
}

export function applyDiscount(base: number, discountPct: number): number {
  return Math.round((base * (100 - discountPct)) / 100);
}

/** Retail discount result, rounded upward to a whole Toman. */
export function applyRetailDiscount(base: number, discountPct: number): number {
  return Math.ceil((base * (100 - discountPct)) / 100);
}

/** Pick the list + final price triple shown to the current user. */
export function resolveProductPrice(
  fields: ProductPriceFields,
  role: PricingRole,
): ResolvedPrice {
  if (isWholesaleUser(role)) {
    const basePrice = toNumber(fields.wholesalePrice);
    const discountPct = pct(fields.wholesaleDiscountPct);
    return {
      basePrice,
      discountPct,
      finalPrice: applyDiscount(basePrice, discountPct),
    };
  }

  const basePrice = computeRetailPrice(fields);
  const discountPct = pct(fields.retailDiscountPct);
  return {
    basePrice,
    discountPct,
    finalPrice: applyRetailDiscount(basePrice, discountPct),
  };
}

/** BigInt-safe variant for order line snapshots. */
export function resolveProductPriceBigInt(
  fields: ProductPriceFields,
  role: PricingRole,
): { basePrice: bigint; discountPct: number; finalPrice: bigint } {
  const resolved = resolveProductPrice(fields, role);
  return {
    basePrice: BigInt(resolved.basePrice),
    discountPct: resolved.discountPct,
    finalPrice: BigInt(resolved.finalPrice),
  };
}

/** Net line total in Toman after a percentage discount. */
export function netLineTotal(
  unitListToman: number,
  quantity: number,
  discountPct: number,
): number {
  return applyDiscount(unitListToman, discountPct) * quantity;
}

/** Net line total using the rounding policy of the current pricing tier. */
export function netLineTotalForRole(
  unitListToman: number,
  quantity: number,
  discountPct: number,
  role: PricingRole,
): number {
  const unitNet = isWholesaleUser(role)
    ? applyDiscount(unitListToman, discountPct)
    : applyRetailDiscount(unitListToman, discountPct);
  return unitNet * quantity;
}

/** Net line total using BigInt list price (order persistence). */
export function netLineTotalBigInt(
  unitList: bigint,
  quantity: number,
  discountPct: number,
): bigint {
  const gross = unitList * BigInt(quantity);
  return (gross * BigInt(Math.round((100 - discountPct) * 100))) / BigInt(10000);
}

/** BigInt-safe line total using the current tier's rounding policy. */
export function netLineTotalBigIntForRole(
  unitList: bigint,
  quantity: number,
  discountPct: number,
  role: PricingRole,
): bigint {
  if (isWholesaleUser(role)) {
    return netLineTotalBigInt(unitList, quantity, discountPct);
  }

  const denominator = BigInt(10000);
  const discountFactor = BigInt(Math.round((100 - discountPct) * 100));
  const unitNumerator = unitList * discountFactor;
  const unitNet = (unitNumerator + denominator - BigInt(1)) / denominator;
  return unitNet * BigInt(quantity);
}
