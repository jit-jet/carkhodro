import assert from 'node:assert/strict';
import test from 'node:test';
import { INVOICE_TYPES, isInvoiceType, orderSourceTypeLabel } from './invoice-type';

test('all documented types have explicit source/type labels', () => {
  assert.deepEqual(INVOICE_TYPES.map((type) => orderSourceTypeLabel('OFFLINE', type)), [
    'فاکتور فروش ثبت شده در حسابداری',
    'فاکتور خرید ثبت شده در حسابداری',
    'فاکتور برگشت از فروش ثبت شده در حسابداری',
    'فاکتور برگشت از خرید ثبت شده در حسابداری',
  ]);
  assert.deepEqual(INVOICE_TYPES.map((type) => orderSourceTypeLabel('ONLINE', type)), [
    'فاکتور فروش ثبت شده در سایت',
    'فاکتور خرید ثبت شده در سایت',
    'فاکتور برگشت از فروش ثبت شده در سایت',
    'فاکتور برگشت از خرید ثبت شده در سایت',
  ]);
  assert.equal(isInvoiceType(4), false);
});
