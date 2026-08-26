import assert from 'node:assert/strict';
import test from 'node:test';
import { itemCodesFromInvoices } from './invoice-stock';

test('targets stock from both direct and nested buy/sell invoice item codes', () => {
  assert.deepEqual(
    itemCodesFromInvoices([
      {
        Number: 'sale-1',
        InvoiceType: 0,
        InvoiceItems: [{ ItemCode: 'A' }, { Item: { Code: 20 } }],
      },
      {
        Number: 'purchase-1',
        InvoiceType: 1,
        InvoiceItems: [{ ItemCode: 'A' }, { ItemCode: ' ' }],
      },
    ]),
    ['A', '20'],
  );
});
