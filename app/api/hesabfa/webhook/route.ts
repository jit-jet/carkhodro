/**
 * Hesabfa change-hook receiver.
 * Authenticates via shared Password, then syncs Product / Contact / Invoice.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleHesabfaWebhook } from '@/src/lib/hesabfa/sync';
import type { HesabfaWebhookPayload } from '@/src/lib/hesabfa/types';

export async function POST(request: NextRequest) {
  let payload: HesabfaWebhookPayload;
  try {
    payload = (await request.json()) as HesabfaWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const expected = process.env.HESABFA_HOOK_PASSWORD;
  if (!expected || payload?.Password !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  if (!payload.ObjectType || !Array.isArray(payload.ObjectIdList)) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }

  try {
    const result = await handleHesabfaWebhook(payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[hesabfa:webhook]', err);
    return NextResponse.json({ ok: false, error: 'sync_failed' }, { status: 500 });
  }
}
