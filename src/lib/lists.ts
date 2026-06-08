/**
 * Shared constants for the wishlist / compare features. Lives outside the
 * `'use server'` action module (which may only export async functions) so both
 * the server actions and the client UI can import it.
 */

/** Max products in the active compare list — keeps the side-by-side view usable. */
export const COMPARE_LIMIT = 4;
