/**
 * Legacy Hesabfa hook test bench. POST uses the same hook-password validation
 * as the production receiver so an old registration remains safe while it is
 * migrated to /api/hesabfa/webhook.
 *
 * GET  /admin/hook renders the recent in-memory event log.
 * POST /admin/hook receives a Hesabfa hook and runs the normal sync handler.
 *
 * This is intentionally separate from the authenticated production receiver at
 * /api/hesabfa/webhook. Events are process-local and disappear after a restart.
 */

import { handleHesabfaWebhook } from '@/src/lib/hesabfa/sync';
import {
  finishHesabfaTestHook,
  listHesabfaTestHooks,
  recordHesabfaTestHook,
} from '@/src/lib/hesabfa/test-hook-store';
import {
  HESABFA_ACTION,
} from '@/src/lib/hesabfa/types';
import { readHesabfaWebhookRequest } from '@/src/lib/hesabfa/webhook-request';

const ACTION_LABELS: Record<number, string> = {
  [HESABFA_ACTION.CONTACT_SAVE]: 'Contact save',
  [HESABFA_ACTION.CONTACT_EDIT]: 'Contact edit',
  [HESABFA_ACTION.CONTACT_DELETE]: 'Contact delete',
  [HESABFA_ACTION.PRODUCT_SAVE]: 'Product save',
  [HESABFA_ACTION.PRODUCT_EDIT]: 'Product edit',
  [HESABFA_ACTION.PRODUCT_DELETE]: 'Product delete',
  [HESABFA_ACTION.PRODUCT_IMPORT]: 'Product Excel import',
  [HESABFA_ACTION.CONTACT_IMPORT]: 'Contact Excel import',
  [HESABFA_ACTION.SALES_INVOICE_SAVE]: 'Sales invoice save',
  [HESABFA_ACTION.SALES_INVOICE_EDIT]: 'Sales invoice edit',
  [HESABFA_ACTION.SALES_INVOICE_DELETE]: 'Sales invoice delete',
  [HESABFA_ACTION.PURCHASE_INVOICE_SAVE]: 'Purchase invoice save',
  [HESABFA_ACTION.PURCHASE_INVOICE_EDIT]: 'Purchase invoice edit',
  [HESABFA_ACTION.PURCHASE_INVOICE_DELETE]: 'Purchase invoice delete',
  [HESABFA_ACTION.SALES_RETURN_SAVE]: 'Sales return save',
  [HESABFA_ACTION.SALES_RETURN_EDIT]: 'Sales return edit',
  [HESABFA_ACTION.SALES_RETURN_DELETE]: 'Sales return delete',
  [HESABFA_ACTION.PURCHASE_RETURN_SAVE]: 'Purchase return save',
  [HESABFA_ACTION.PURCHASE_RETURN_EDIT]: 'Purchase return edit',
  [HESABFA_ACTION.PURCHASE_RETURN_DELETE]: 'Purchase return delete',
  [HESABFA_ACTION.WASTE_INVOICE_SAVE]: 'Waste invoice save',
  [HESABFA_ACTION.WASTE_INVOICE_EDIT]: 'Waste invoice edit',
  [HESABFA_ACTION.WASTE_INVOICE_DELETE]: 'Waste invoice delete',
  [HESABFA_ACTION.RECEIVE_RECEIPT_SAVE]: 'Receive receipt save',
  [HESABFA_ACTION.RECEIVE_RECEIPT_EDIT]: 'Receive receipt edit',
  [HESABFA_ACTION.RECEIVE_RECEIPT_DELETE]: 'Receive receipt delete',
  [HESABFA_ACTION.PAYMENT_RECEIPT_SAVE]: 'Payment receipt save',
  [HESABFA_ACTION.PAYMENT_RECEIPT_EDIT]: 'Payment receipt edit',
  [HESABFA_ACTION.PAYMENT_RECEIPT_DELETE]: 'Payment receipt delete',
  [HESABFA_ACTION.WAREHOUSE_RECEIPT_SAVE]: 'Warehouse receipt save',
  [HESABFA_ACTION.WAREHOUSE_RECEIPT_EDIT]: 'Warehouse receipt edit',
  [HESABFA_ACTION.WAREHOUSE_RECEIPT_DELETE]: 'Warehouse receipt delete',
  [HESABFA_ACTION.ONLINE_INVOICE_PAYMENT_SAVE]: 'Online invoice payment save',
  [HESABFA_ACTION.ONLINE_CONTACT_DEPOSIT_SAVE]: 'Online contact deposit save',
};

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderPage(origin: string): string {
  const events = listHesabfaTestHooks();
  const actionRows = Object.entries(ACTION_LABELS)
    .map(([code, label]) => `<tr><td>${code}</td><td>${escapeHtml(label)}</td></tr>`)
    .join('');
  const eventRows = events.length
    ? events
        .map(
          (event) => `<tr>
            <td>${event.id}</td>
            <td>${escapeHtml(event.receivedAt)}</td>
            <td>${escapeHtml(event.status)}</td>
            <td><pre>${escapeHtml(JSON.stringify(event.payload, null, 2))}</pre></td>
            <td><pre>${escapeHtml(JSON.stringify(event.result ?? event.error ?? null, null, 2))}</pre></td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="5">No hooks received in this server process.</td></tr>';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="5">
  <title>Hesabfa Hook Test</title>
  <style>body{font-family:monospace;margin:24px}table{border-collapse:collapse;width:100%;margin-bottom:32px}th,td{border:1px solid #999;padding:6px;vertical-align:top;text-align:left}pre{margin:0;white-space:pre-wrap;word-break:break-word}code{user-select:all}</style>
</head>
<body>
  <h1>Hesabfa Hook Test</h1>
  <p>Public POST endpoint: <code>${escapeHtml(`${origin}/admin/hook`)}</code></p>
  <p>POST requests require the configured Hesabfa hook password. Password values are redacted from this page. The newest 200 authenticated events are stored in memory and disappear on restart. Page refreshes every 5 seconds.</p>
  <h2>Received hooks</h2>
  <table>
    <thead><tr><th>ID</th><th>Received</th><th>Status</th><th>Payload</th><th>Result / error</th></tr></thead>
    <tbody>${eventRows}</tbody>
  </table>
  <h2>Documented Hesabfa action codes</h2>
  <table>
    <thead><tr><th>Action</th><th>Meaning</th></tr></thead>
    <tbody>${actionRows}</tbody>
  </table>
</body>
</html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('format') === 'json') {
    return Response.json({ ok: true, events: listHesabfaTestHooks(), actions: ACTION_LABELS });
  }

  return new Response(renderPage(url.origin), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  const parsed = await readHesabfaWebhookRequest(request);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const { payload } = parsed;
  const event = recordHesabfaTestHook(payload);

  try {
    const result = await handleHesabfaWebhook(payload);
    finishHesabfaTestHook(event.id, { status: 'processed', result });
    return Response.json({ ok: true, eventId: event.id, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    finishHesabfaTestHook(event.id, { status: 'failed', error: message });
    console.error('[hesabfa:test-hook] sync_failed', error);
    return Response.json(
      { ok: false, eventId: event.id, error: 'sync_failed', message },
      { status: 500 },
    );
  }
}
