/**
 * Order-quantity UI limits — retail is capped at stock; wholesale is not.
 */

import type { PricingRole } from '@/src/lib/user-role';
import { isWholesaleUser } from '@/src/lib/user-role';

/** Per-line UI cap for add-to-cart quantity inputs. `null` = no cap (wholesale). */
export function orderQuantityCapForRole(stock: number, role: PricingRole): number | null {
  if (isWholesaleUser(role)) return null;
  return stock < 1 ? 0 : stock;
}

export function resolveOrderQtyUI(product: {
  stock: number;
  orderQuantityCap?: number | null;
}) {
  const cap =
    product.orderQuantityCap !== undefined
      ? product.orderQuantityCap
      : orderQuantityCapForRole(product.stock, null);
  // Wholesale products use a null cap and remain orderable even when current
  // inventory is zero or negative (the invoice acts as a backorder).
  const inStock = cap === null || product.stock > 0;
  const stockCapped = inStock && cap !== null;
  return {
    inStock,
    stockCapped,
    maxQty: stockCapped ? cap : null,
  };
}
