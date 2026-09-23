import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchWebhookInvoices } from './webhook-invoices';

test('uses a second complete read so an edit does not import stale state', async () => {
  const calls: number[][] = [];
  const delays: number[] = [];
  const invoices = await fetchWebhookInvoices([10], {
    retryDelaysMs: [5, 10],
    sleep: async (ms) => { delays.push(ms); },
    getByIds: async (ids) => {
      calls.push(ids);
      return [{ Id: 10, Number: 100, InvoiceType: 0, Status: calls.length === 1 ? 0 : 1 }];
    },
  });

  assert.deepEqual(delays, [5, 10]);
  assert.equal(calls.length, 2);
  assert.equal(invoices[0]?.Status, 1);
});

test('retries a newly-created invoice until it becomes visible', async () => {
  let calls = 0;
  const invoices = await fetchWebhookInvoices([20], {
    retryDelaysMs: [0, 0, 0],
    sleep: async () => {},
    getByIds: async () => {
      calls++;
      return calls === 1 ? [] : [{ Id: 20, Number: 200, InvoiceType: 0 }];
    },
  });

  assert.equal(calls, 2);
  assert.equal(invoices[0]?.Id, 20);
});

test('does not report success when an invoice remains unavailable', async () => {
  await assert.rejects(
    fetchWebhookInvoices([30], {
      retryDelaysMs: [0, 0],
      sleep: async () => {},
      getByIds: async () => [],
    }),
    /30/,
  );
});

test('retries a transient API failure', async () => {
  let calls = 0;
  const invoices = await fetchWebhookInvoices([40], {
    retryDelaysMs: [0, 0, 0],
    sleep: async () => {},
    getByIds: async () => {
      calls++;
      if (calls === 1) throw new Error('not committed yet');
      return [{ Id: 40, Number: 400, InvoiceType: 0 }];
    },
  });

  assert.equal(calls, 2);
  assert.equal(invoices[0]?.Id, 40);
});
