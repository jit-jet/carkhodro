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
