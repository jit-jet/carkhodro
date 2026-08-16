import assert from 'node:assert/strict';
import test from 'node:test';
import { planInvoiceIdentitySync } from './invoice-identity';

test('updates an existing order matched by invoice number', () => {
  const invoice = { number: '1001', hesabfaId: 20, invoiceType: 0 };
  const plan = planInvoiceIdentitySync(
    [invoice],
    [{ id: 'order-1', hesabfaCode: '1001', hesabfaId: 20 }],
  );

  assert.deepEqual(plan.matches, [{ orderId: 'order-1', invoice }]);
  assert.equal(plan.skipped, 0);
});

test('never creates an order for an unknown Hesabfa invoice', () => {
  const plan = planInvoiceIdentitySync(
    [{ number: '9999', hesabfaId: 99, invoiceType: 0 }],
    [],
  );

  assert.deepEqual(plan.matches, []);
  assert.equal(plan.skipped, 1);
});

test('falls back to numeric id when an existing invoice number changed', () => {
  const invoice = { number: '1002', hesabfaId: 20, invoiceType: 0 };
  const plan = planInvoiceIdentitySync(
    [invoice],
    [{ id: 'order-1', hesabfaCode: '1001', hesabfaId: 20 }],
  );

  assert.deepEqual(plan.matches, [{ orderId: 'order-1', invoice }]);
});

test('releases a recycled invoice id from a stale number owner', () => {
  const invoice = { number: '1002', hesabfaId: 20, invoiceType: 0 };
  const plan = planInvoiceIdentitySync(
    [invoice],
    [
      { id: 'current-number-owner', hesabfaCode: '1002', hesabfaId: 30 },
      { id: 'stale-id-owner', hesabfaCode: '1001', hesabfaId: 20 },
    ],
  );

  assert.deepEqual(plan.matches, [{ orderId: 'current-number-owner', invoice }]);
  assert.deepEqual(plan.hesabfaIdsToRelease, [
    { orderId: 'stale-id-owner', hesabfaId: 20 },
  ]);
});

test('ignores non-sales invoices', () => {
  const plan = planInvoiceIdentitySync(
    [{ number: '1001', hesabfaId: 20, invoiceType: 1 }],
    [{ id: 'order-1', hesabfaCode: '1001', hesabfaId: 20 }],
  );

  assert.deepEqual(plan.matches, []);
  assert.equal(plan.skipped, 1);
});
