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

import {
  captureAdminAuditContext,
  recordAdminMutation,
} from '@/src/lib/admin-audit';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

const TRANSIENT_DATABASE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'P1001',
  '57P01',
  '57P02',
  '57P03',
]);

function errorChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  const seen = new Set<unknown>();
  let current = error;

  while (current != null && !seen.has(current) && chain.length < 8) {
    chain.push(current);
    seen.add(current);
    current =
      typeof current === 'object' && 'cause' in current
        ? (current as { cause?: unknown }).cause
        : undefined;
  }

  return chain;
}

function hasErrorCode(error: unknown, code: string): boolean {
  return errorChain(error).some(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'code' in item &&
      (item as { code?: unknown }).code === code,
  );
}

function isTransientDatabaseError(error: unknown): boolean {
  return errorChain(error).some((item) => {
    if (typeof item === 'object' && item !== null && 'code' in item) {
      const code = (item as { code?: unknown }).code;
      if (typeof code === 'string' && TRANSIENT_DATABASE_CODES.has(code)) return true;
    }

    const message = item instanceof Error ? item.message.toLowerCase() : '';
    return (
      message.includes('connection terminated unexpectedly') ||
      message.includes('connection reset') ||
      message.includes('server closed the connection unexpectedly')
    );
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    if (isTransientDatabaseError(err)) {
      await wait(100);
      try {
        return await fn();
      } catch (retryErr) {
        err = retryErr;
      }
    }

    const isConnRefused = hasErrorCode(err, 'ECONNREFUSED');
    if (!isConnRefused) {
      console.error(`[query:${label}]`, err);
    }
    return fallback;
  }
}

/** Wrap a mutation body so unexpected throws become a typed failure result. */
export async function runMutation<T>(
  label: string,
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const auditContext = await captureAdminAuditContext(label);
  try {
    const result = await fn();
    await recordAdminMutation(auditContext, label, result.ok ? 'SUCCESS' : 'FAILURE');
    return result;
  } catch (err) {
    console.error(`[mutation:${label}]`, err);
    await recordAdminMutation(auditContext, label, 'FAILURE');
    return fail('خطای غیرمنتظره رخ داد. لطفاً دوباره تلاش کنید.');
  }
}
