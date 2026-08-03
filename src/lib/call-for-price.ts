/**
 * Call-for-price helpers — hide price / block purchase per audience.
 * Retail (and guests / admin / support on storefront) follow `callForPriceRetail`.
 * Wholesale partners follow `callForPriceWholesale`.
 */

import { isWholesaleUser, type PricingRole } from '@/src/lib/user-role';

export interface CallForPriceFlags {
  callForPriceRetail: boolean;
  callForPriceWholesale: boolean;
}

/** True when the viewer’s audience has call-for-price enabled on this product. */
export function isCallForPriceForRole(
  flags: CallForPriceFlags,
  role: PricingRole,
): boolean {
  return isWholesaleUser(role)
    ? flags.callForPriceWholesale
    : flags.callForPriceRetail;
}

export const CALL_FOR_PRICE_LABEL = 'تماس برای قیمت';
export const CALL_FOR_PRICE_BLOCKED_MSG =
  'این محصول فقط با تماس قابل سفارش است. لطفاً برای قیمت تماس بگیرید.';
