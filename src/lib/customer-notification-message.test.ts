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
    'همکار گرامی، سفارش شما با شماره فاکتور 1000 با موفقیت ثبت شد.',
    'سفارش در انتظار بررسی و تأیید مدیریت است.',
    'پس از تأیید، نتیجه از طریق پیامک به شما اطلاع داده می‌شود.',
    'carkhodro.com',
  ].join('\n'));
  assert.equal(wholesaleInvoiceApprovedMessage('1001'), [
    'کارخودرو',
    'همکار گرامی، سفارش شما با شماره فاکتور 1001 توسط مدیریت تأیید شد.',
    'برای مشاهده جزئیات و ادامه فرایند، به پنل همکاری مراجعه کنید.',
    'carkhodro.com',
  ].join('\n'));
  assert.equal(retailPurchasePaidMessage(42), [
    'کارخودرو',
    'مشتری گرامی، سفارش شما با شماره 42 با موفقیت پرداخت و ثبت شد.',
    'سفارش شما در حال بررسی و آماده‌سازی است.',
    'carkhodro.com',
  ].join('\n'));
});

test('approval SMS belongs only to the first pending-to-approved wholesale transition', () => {
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'AWAITING_CONFIRMATION', 'CONFIRMED_AWAITING_PAYMENT'), true);
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'NEW', 'CONFIRMED_AWAITING_PAYMENT'), true);
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'CONFIRMED_AWAITING_PAYMENT', 'CONFIRMED_AWAITING_PAYMENT'), false);
  assert.equal(isWholesaleApprovalTransition('RETAIL', 'AWAITING_CONFIRMATION', 'CONFIRMED_AWAITING_PAYMENT'), false);
  assert.equal(isWholesaleApprovalTransition('WHOLESALE', 'AWAITING_CONFIRMATION', 'PAID'), false);
});
