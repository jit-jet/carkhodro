/**
 * Hesabfa change-hook receiver.
 * Authenticates via shared Password, then syncs Product / Contact / Invoice.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleHesabfaWebhook } from '@/src/lib/hesabfa/sync';
import type { HesabfaWebhookPayload } from '@/src/lib/hesabfa/types';

export async func   tion POST(request: NextRequest) {
  let payload: HesabfaWebhookPayload;
  console.log('request', request);
  try {
    payload = (await request.json()) as HesabfaWebhookPayload;
  } catch {
    console.error('[hesabfa:webhook] invalid_json');
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  console.log('[hesabfa:webhook] received', {
    ObjectType: payload?.ObjectType,
    Action: payload?.Action,
    ObjectIdList: payload?.ObjectIdList,
    // Password intentionally omitted
  });

  const expected = process.env.HESABFA_HOOK_PASSWORD;
  if (!expected || payload?.Password !== expected) {
    console.warn('[hesabfa:webhook] unauthorized');
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  if (!payload.ObjectType || !Array.isArray(payload.ObjectIdList)) {
    console.warn('[hesabfa:webhook] invalid_payload', payload);
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }

  try {
    const result = await handleHesabfaWebhook(payload);
    console.log('[hesabfa:webhook] result', result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[hesabfa:webhook] sync_failed', err);
    return NextResponse.json({ ok: false, error: 'sync_failed' }, { status: 500 });
  }
}
