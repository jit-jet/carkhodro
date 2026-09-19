import assert from 'node:assert/strict';
import test from 'node:test';
import { hesabfaApprovalOrderStatus, mapHesabfaToLocalStatus } from './invoice-status';

test('uses Hesabfa draft and approval as the two partner invoice states', () => {
  assert.equal(hesabfaApprovalOrderStatus(0), 'AWAITING_CONFIRMATION');
  assert.equal(hesabfaApprovalOrderStatus(1), 'CONFIRMED_AWAITING_PAYMENT');
  assert.equal(hesabfaApprovalOrderStatus(undefined), null);
  assert.equal(hesabfaApprovalOrderStatus(2), null);

  const draft = mapHesabfaToLocalStatus(
    { Number: '1001', Status: 0 }, 'WHOLESALE', 'NEW',
  );
  const approved = mapHesabfaToLocalStatus(
    { Number: '1001', Status: 1 }, 'WHOLESALE', 'AWAITING_CONFIRMATION',
  );
  assert.equal(draft.status, 'AWAITING_CONFIRMATION');
  assert.equal(approved.status, 'CONFIRMED_AWAITING_PAYMENT');
});

test('partner payment and shipping do not replace invoice approval', () => {
  const patch = mapHesabfaToLocalStatus(
    { Number: '1001', Status: 1, Paid: 100, Rest: 0, Sent: true },
    'WHOLESALE',
    'AWAITING_CONFIRMATION',
  );
  assert.equal(patch.status, 'CONFIRMED_AWAITING_PAYMENT');
  assert.equal(patch.paymentStatus, 'PAID');
  assert.ok(patch.shippedAt instanceof Date);

  const shipped = mapHesabfaToLocalStatus(
    { Number: '1001', Status: 0 }, 'WHOLESALE', 'SHIPPED',
  );
  assert.equal(shipped.status, undefined);
});

test('marks a paid, unsent invoice as paid', () => {
  const patch = mapHesabfaToLocalStatus({
    Number: '1001',
    Paid: 100,
    Rest: 0,
    Sent: false,
  });

  assert.equal(patch.paymentStatus, 'PAID');
  assert.equal(patch.status, 'PAID');
  assert.ok(patch.paidAt instanceof Date);
});

test('marks a sent invoice as shipped', () => {
  const patch = mapHesabfaToLocalStatus({
    Number: '1001',
    Paid: 0,
    Rest: 100,
    Sent: true,
  });

  assert.equal(patch.status, 'SHIPPED');
  assert.ok(patch.shippedAt instanceof Date);
});

test('does not regress an order from an unpaid, unsent invoice', () => {
  const patch = mapHesabfaToLocalStatus({
    Number: '1001',
    Paid: 0,
    Rest: 100,
    Sent: false,
  });

  assert.deepEqual(patch, {});
});
