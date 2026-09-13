import assert from 'node:assert/strict';
import test from 'node:test';
import { hydrateInvoiceBatch } from './invoice-hydration';
import type { HesabfaInvoice } from './types';

const rows: HesabfaInvoice[] = [
  { Id: 11, Number: '001', InvoiceType: 0 },
  { Id: 12, Number: '002', InvoiceType: 0 },
];

test('hydrates by ID in one request and preserves the list order', async () => {
  const requested: number[][] = [];
  const result = await hydrateInvoiceBatch(rows, 0, {
    getByIds: async (ids) => {
      requested.push(ids);
      return [
        { Id: 12, Number: '002', InvoiceType: 0, InvoiceItems: [] },
        { Id: 11, Number: '001', InvoiceType: 0, InvoiceItems: [] },
      ];
    },
    getByNumber: async () => { throw new Error('unexpected fallback'); },
  });

  assert.deepEqual(requested, [[11, 12]]);
  assert.deepEqual(result.map((invoice) => invoice?.Number), ['001', '002']);
});

test('falls back for missing or incomplete batch details without changing invoice identity', async () => {
  const requested: Array<string | number> = [];
  const result = await hydrateInvoiceBatch(rows, 0, {
    getByIds: async () => [
      { Id: 11, Number: '999', InvoiceType: 0, InvoiceItems: [] },
      { Id: 12, Number: '002', InvoiceType: 0 },
    ],
    getByNumber: async (number) => {
      requested.push(number);
      return { Number: number, InvoiceType: 0, InvoiceItems: [] };
    },
  });

  assert.deepEqual(requested, ['001', '002']);
  assert.deepEqual(result.map((invoice) => invoice?.Number), ['001', '002']);
});

test('falls back to the existing per-number API when batch retrieval fails', async () => {
  const result = await hydrateInvoiceBatch(rows, 0, {
    getByIds: async () => { throw new Error('batch unavailable'); },
    getByNumber: async (number) => ({ Number: number, InvoiceItems: [] }),
  });

  assert.deepEqual(result.map((invoice) => invoice?.Number), ['001', '002']);
});

test('uses per-number retrieval for list rows without an ID', async () => {
  const result = await hydrateInvoiceBatch([{ Number: '003' }], 0, {
    getByIds: async () => { throw new Error('unexpected batch request'); },
    getByNumber: async (number) => ({ Number: number, InvoiceItems: [] }),
  });

  assert.equal(result[0]?.Number, '003');
});

test('rejects a batch detail from the wrong invoice type', async () => {
  const result = await hydrateInvoiceBatch([{ Id: 11, Number: '001' }], 0, {
    getByIds: async () => [{ Id: 11, Number: '001', InvoiceType: 1, InvoiceItems: [] }],
    getByNumber: async () => null,
  });

  assert.deepEqual(result, [null]);
});
