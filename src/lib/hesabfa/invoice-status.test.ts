import assert from 'node:assert/strict';
import test from 'node:test';
import { mapHesabfaToLocalStatus } from './invoice-status';

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
