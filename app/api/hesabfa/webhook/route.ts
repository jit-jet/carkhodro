/**
 * Hesabfa change-hook receiver.
 * Authenticates via shared Password, then syncs the documented Product,
 * Contact, and Invoice object types.
 */

import { handleHesabfaWebhook } from '@/src/lib/hesabfa/sync';
import { readHesabfaWebhookRequest } from '@/src/lib/hesabfa/webhook-request';

export async function POST(request: Request) {
  const parsed = await readHesabfaWebhookRequest(request);
  if (!parsed.ok) {
    console.warn(`[hesabfa:webhook] ${parsed.error}`);
    return Response.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }
  const { payload } = parsed;

  console.log('[hesabfa:webhook] received', {
    ObjectType: payload?.ObjectType,
    Action: payload?.Action,
    ObjectIdList: payload?.ObjectIdList,
    // Password intentionally omitted
  });

  try {
    const result = await handleHesabfaWebhook(payload);
    console.log('[hesabfa:webhook] result', result);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error('[hesabfa:webhook] sync_failed', err);
    return Response.json({ ok: false, error: 'sync_failed' }, { status: 500 });
  }
}
