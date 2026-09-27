import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isWholesaleApprovalTransition,
  retailPurchasePaidMessage,
  wholesaleActivationMessage,
  wholesaleInvoiceApprovedMessage,
  wholesaleInvoiceSubmittedMessage,
} from './customer-notification-message';

test('customer messages identify the event without exposing admin details', () => {
  assert.equal(wholesaleActivationMessage(), [
    'کاربر گرامی کارخودرو',
    'حساب کاربری شما به «همکار» تغییر یافت.',
    'از این پس می‌توانید از قیمت‌ها و امکانات همکاری استفاده کنید.',
    'carkhodro.com',
  ].join('\n'));
  assert.equal(wholesaleInvoiceSubmittedMessage('1000'), [
    'کارخودرو',
    '',
    'همکار گرامی،سفارش شما با شماره فاکتور 1000 با موفقیت ثبت شد.',
  ].join('\n'));
  assert.equal(wholesaleInvoiceApprovedMessage('1001'), [
    'کارخودرو',
    'همکار گرامی، فاکتور 1001 شما تأیید شد.',
  ].join('\n'));
  assert.equal(retailPurchasePaidMessage(42), [
    'کارخودرو',
    'سفارش 42 با موفقیت پرداخت و ثبت شد.',
  ].join('\n'));
});

test('approved wholesale and paid retail messages fit in one Persian SMS part', () => {
  assert.ok(wholesaleInvoiceApprovedMessage('1001').length < 70);
  assert.ok(retailPurchasePaidMessage(42).length < 70);
});

test('approval SMS belongs only to the first pending-to-approved wholesale transition', () => {
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'AWAITING_CONFIRMATION', 'CONFIRMED_AWAITING_PAYMENT'), true);
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'NEW', 'CONFIRMED_AWAITING_PAYMENT'), true);
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'CONFIRMED_AWAITING_PAYMENT', 'CONFIRMED_AWAITING_PAYMENT'), false);
  assert.equal(isWholesaleApprovalTransition('RETAIL', 'AWAITING_CONFIRMATION', 'CONFIRMED_AWAITING_PAYMENT'), false);
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'AWAITING_CONFIRMATION', 'PAID'), false);
});
