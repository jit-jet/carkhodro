/**
 * Hesabfa change-hook receiver.
 * Authenticates via shared Password, then syncs the documented Product,
 * Contact, and Invoice object types.
 */

import { handleHesabfaWebhook } from '@/src/lib/hesabfa/sync';
import { readHesabfaWebhookRequest } from '@/src/lib/hesabfa/webhook-request';
import { after } from 'next/server';

export const maxDuration = 60;

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

  // Acknowledge immediately. Hesabfa may time out while we wait for its invoice
  // API to expose a just-created/edited row. `after` keeps this request alive
  // while the retrying synchronization finishes on the self-hosted Next server.
  after(async () => {
    try {
      const result = await handleHesabfaWebhook(payload);
      console.log('[hesabfa:webhook] result', result);
    } catch (err) {
      console.error('[hesabfa:webhook] sync_failed', err);
    }
  });

  return Response.json(
    { ok: true, accepted: true, objectType: payload.ObjectType, action: payload.Action },
    { status: 202 },
  );
}
