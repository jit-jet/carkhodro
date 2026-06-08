/**
 * Shared Server Action result helpers.
 * ────────────────────────────────────
 * Convention used across `actions/`:
 *   • Reads (queries)  → return the data directly so React Server Components can
 *                        `await` them. They never throw to the render tree:
 *                        failures are logged and a safe fallback is returned via
 *                        `safeQuery`.
 *   • Writes (mutations) → return an `ActionResult<T>` discriminated union so
 *                        Client Components / forms can branch on success.
 */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

/**
 * Run a read query, returning `fallback` if it throws. Keeps RSC trees from
 * crashing when the database is briefly unavailable.
 */
export async function safeQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[query:${label}]`, err);
    return fallback;
  }
}

/** Wrap a mutation body so unexpected throws become a typed failure result. */
export async function runMutation<T>(
  label: string,
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[mutation:${label}]`, err);
    return fail('خطای غیرمنتظره رخ داد. لطفاً دوباره تلاش کنید.');
  }
}
