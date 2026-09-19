import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isWholesaleApprovalTransition,
  retailPurchasePaidMessage,
  wholesaleActivationMessage,
  wholesaleInvoiceApprovedMessage,
} from './customer-notification-message';

test('customer messages identify the event without exposing admin details', () => {
  assert.match(wholesaleActivationMessage(), /قیمت همکاری/);
  assert.match(wholesaleInvoiceApprovedMessage('1001'), /فاکتور 1001 شما تأیید شد/);
  assert.match(retailPurchasePaidMessage(42), /خرید 42 با موفقیت پرداخت و ثبت شد/);
});

test('approval SMS belongs only to the first pending-to-approved wholesale transition', () => {
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'AWAITING_CONFIRMATION', 'CONFIRMED_AWAITING_PAYMENT'), true);
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'NEW', 'CONFIRMED_AWAITING_PAYMENT'), true);
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'CONFIRMED_AWAITING_PAYMENT', 'CONFIRMED_AWAITING_PAYMENT'), false);
  assert.equal(isWholesaleApprovalTransition('RETAIL', 'AWAITING_CONFIRMATION', 'CONFIRMED_AWAITING_PAYMENT'), false);
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'AWAITING_CONFIRMATION', 'PAID'), false);
});
