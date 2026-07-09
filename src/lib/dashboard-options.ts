/**
 * Shared dashboard option constants.
 * ───────────────────────────────────────────
 * Lives in a directive-free module (not a `'use server'` action file, which may
 * only export async functions) so both the actions and the Client Components can
 * import these plain values.
 */

/** Settlement terms a partner can pick on the invoice; the first is the default. */
export const PAYMENT_TERMS = ['نقدی', 'چکی', 'اعتباری', 'کارت به کارت'] as const;

/** Page-size options for the orders list. */
export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

/** Default orders-list page size. */
export const DEFAULT_PER_PAGE = 50;
