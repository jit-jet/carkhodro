/**
 * Order-quantity UI limits — retail is capped at stock; wholesale is not.
 */

import type { PricingRole } from '@/src/lib/user-role';
import { isWholesaleUser } from '@/src/lib/user-role';

/** Per-line UI cap for add-to-cart quantity inputs. `null` = no cap (wholesale). */
export function orderQuantityCapForRole(stock: number, role: PricingRole): number | null {
  if (stock < 1) return 0;
  return isWholesaleUser(role) ? null : stock;
}

export function resolveOrderQtyUI(product: {
  stock: number;
  orderQuantityCap?: number | null;
}) {
  const inStock = product.stock > 0;
  const cap =
    product.orderQuantityCap !== undefined
      ? product.orderQuantityCap
      : orderQuantityCapForRole(product.stock, null);
  const stockCapped = inStock && cap !== null;
  return {
    inStock,
    stockCapped,
    maxQty: stockCapped ? cap : null,
  };
}
