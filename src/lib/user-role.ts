/**
 * User-role helpers for pricing and access control.
 * ────────────────────────────────────────────────
 * Guests (no session) are treated as RETAIL for price display and checkout.
 */

import type { UserRole } from '@/generated/prisma_client';

/** Role used when resolving catalogue / cart prices. */
export type PricingRole = UserRole | null;

export function isWholesaleUser(role: PricingRole): boolean {
  return role === 'WHOLESALE';
}

export function isRetailUser(role: PricingRole): boolean {
  return role === null || role === 'RETAIL';
}

/** Admin and support staff see retail pricing on the storefront. */
export function isStorefrontRetailRole(role: PricingRole): boolean {
  return isRetailUser(role) || role === 'ADMIN' || role === 'SUPPORT';
}

export function pricingRoleFromUser(role: UserRole | undefined | null): PricingRole {
  return role ?? null;
}

/** Cart page path for the given role. */
export function cartPathForRole(role: PricingRole): '/cart' | '/dashboard/cart' {
  return isWholesaleUser(role) ? '/dashboard/cart' : '/cart';
}

/** Retail storefront cart + checkout (guests included). */
export function canUseRetailCheckout(role: UserRole | undefined | null): boolean {
  return !isWholesaleUser(role ?? null);
}

/** Dashboard invoice cart — wholesale partners only. */
export function canUseDashboardCart(role: UserRole | undefined | null): boolean {
  return isWholesaleUser(role ?? null);
}

export function isProductInStock(stock: number): boolean {
  return stock >= 1;
}

/** Clamp a line quantity for cart mutations. Wholesale is not capped by stock. */
export function clampOrderQuantity(
  quantity: number,
  stock: number,
  role: PricingRole,
): number {
  const q = Math.max(1, Math.round(quantity));
  if (isWholesaleUser(role)) return q;
  return Math.min(stock, q);
}

/** True when retail quantity was reduced because of available stock. */
export function wasQuantityStockCapped(
  wanted: number,
  applied: number,
  role: PricingRole,
): boolean {
  return isRetailUser(role) && applied < wanted;
}

/** Merge an add-to-cart increment with existing quantity. */
export function mergeCartQuantity(
  existingQty: number,
  addQty: number,
  stock: number,
  role: PricingRole,
): number {
  return clampOrderQuantity(existingQty + addQty, stock, role);
}
