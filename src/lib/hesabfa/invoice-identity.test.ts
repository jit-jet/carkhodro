import assert from 'node:assert/strict';
import test from 'node:test';
import { planInvoiceIdentitySync } from './invoice-identity';

test('updates an existing order matched by invoice number', () => {
  const invoice = { number: '1001', hesabfaId: 20, invoiceType: 0 };
  const plan = planInvoiceIdentitySync(
    [invoice],
    [{ id: 'order-1', hesabfaCode: '1001', hesabfaId: 20, invoiceType: 0 }],
  );

  assert.deepEqual(plan.matches, [{ orderId: 'order-1', invoice }]);
  assert.equal(plan.skipped, 0);
});

test('plans an offline order for an unknown Hesabfa invoice', () => {
  const plan = planInvoiceIdentitySync(
    [{ number: '9999', hesabfaId: 99, invoiceType: 0 }],
    [],
  );

  assert.deepEqual(plan.matches, []);
  assert.equal(plan.toCreate.length, 1);
  assert.equal(plan.skipped, 0);
});

test('falls back to numeric id when an existing invoice number changed', () => {
  const invoice = { number: '1002', hesabfaId: 20, invoiceType: 0 };
  const plan = planInvoiceIdentitySync(
    [invoice],
    [{ id: 'order-1', hesabfaCode: '1001', hesabfaId: 20, invoiceType: 0 }],
  );

  assert.deepEqual(plan.matches, [{ orderId: 'order-1', invoice }]);
});

test('releases a recycled invoice id from a stale number owner', () => {
  const invoice = { number: '1002', hesabfaId: 20, invoiceType: 0 };
  const plan = planInvoiceIdentitySync(
    [invoice],
    [
      { id: 'current-number-owner', hesabfaCode: '1002', hesabfaId: 30, invoiceType: 0 },
      { id: 'stale-id-owner', hesabfaCode: '1001', hesabfaId: 20, invoiceType: 0 },
    ],
  );

  assert.deepEqual(plan.matches, [{ orderId: 'current-number-owner', invoice }]);
  assert.deepEqual(plan.hesabfaIdsToRelease, [
    { orderId: 'stale-id-owner', hesabfaId: 20 },
  ]);
});

test('matches purchase invoices by type without stealing a sales number', () => {
  const plan = planInvoiceIdentitySync(
    [{ number: '1001', hesabfaId: 20, invoiceType: 1 }],
    [{ id: 'order-1', hesabfaCode: '1001', hesabfaId: 10, invoiceType: 0 }],
  );

  assert.deepEqual(plan.matches, []);
  assert.equal(plan.toCreate.length, 1);
});

test('matches every supported type by its own number', () => {
  const invoices = [0, 1, 2, 3].map((invoiceType) => ({ number: '1001', hesabfaId: invoiceType + 1, invoiceType }));
  const orders = invoices.map((invoice) => ({ id: `order-${invoice.invoiceType}`, hesabfaCode: invoice.number, hesabfaId: invoice.hesabfaId, invoiceType: invoice.invoiceType }));
  const plan = planInvoiceIdentitySync(invoices, orders);
  assert.equal(plan.matches.length, 4);
  assert.equal(plan.toCreate.length, 0);
});
