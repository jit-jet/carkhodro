/**
 * Order-quantity UI limits — every role requires positive stock; retail is
 * capped at the available quantity while wholesale has no quantity cap.
 */

import type { PricingRole } from '@/src/lib/user-role';
import { isProductInStock, isWholesaleUser } from '@/src/lib/user-role';

/** Per-line UI cap for add-to-cart quantity inputs. `null` = no cap (wholesale). */
export function orderQuantityCapForRole(stock: number, role: PricingRole): number | null {
  if (!isProductInStock(stock)) return 0;
  if (isWholesaleUser(role)) return null;
  return stock;
}

export function resolveOrderQtyUI(product: {
  stock: number;
  orderQuantityCap?: number | null;
}) {
  const cap =
    product.orderQuantityCap !== undefined
      ? product.orderQuantityCap
      : orderQuantityCapForRole(product.stock, null);
  // A null cap means an in-stock wholesale product has no quantity limit. It
  // must never turn zero/negative inventory into an orderable product.
  const inStock = isProductInStock(product.stock);
  const stockCapped = inStock && cap !== null;
  return {
    inStock,
    stockCapped,
    maxQty: stockCapped ? cap : null,
  };
}
