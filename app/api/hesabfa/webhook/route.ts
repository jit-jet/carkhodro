/**
 * Hesabfa change-hook receiver.
 * ─────────────────────────────
 * POST endpoint Hesabfa calls whenever a watched object changes. We authenticate
 * via the shared `Password` (the `hookPassword` registered with `setChangeHook`),
 * act only on `Product` changes, and refetch the affected items so we persist
 * Hesabfa's current truth rather than trusting the (id-only) payload.
 *
 * Register it with the `registerHesabfaWebhook` Server Action (or Hesabfa's
 * `setting/setChangeHook`) pointing at `<APP_URL>/api/hesabfa/webhook`.
 *
 * Returns 200 on success/ignore, 401 on a bad password, 400 on a malformed body,
 * and 500 on a sync failure (so Hesabfa retries). We `await` the sync because it
 * only touches a few items — fast enough to finish inside the request.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { syncHesabfaByIds } from '@/src/lib/hesabfa/sync';
import type { HesabfaWebhookPayload } from '@/src/lib/hesabfa/types';

// Prisma (pg adapter) needs the Node.js runtime — never the Edge runtime.
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let payload: HesabfaWebhookPayload;
  try {
    payload = (await request.json()) as HesabfaWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  // Authenticate: the password must match the one we registered with Hesabfa.
  const expected = process.env.HESABFA_HOOK_PASSWORD;
  if (!expected || payload?.Password !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  // We only mirror product changes; ack everything else so Hesabfa stops retrying.
  if (payload.ObjectType !== 'Product') {
    return NextResponse.json({ ok: true, ignored: payload.ObjectType });
  }

  const ids = (payload.ObjectIdList ?? [])
    .map(Number)
    .filter((n) => Number.isFinite(n));

  try {
    const { created, updated, skipped } = await syncHesabfaByIds(ids);
    return NextResponse.json({ ok: true, created, updated, skipped });
  } catch (err) {
    console.error('[hesabfa:webhook]', err);
    // Non-2xx → Hesabfa will retry the delivery later.
    return NextResponse.json({ ok: false, error: 'sync_failed' }, { status: 500 });
  }
}
