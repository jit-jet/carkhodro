import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdminInvoiceUrl,
  buildAdminOrderNotificationMessage,
} from './order-notification-message';

test('builds the absolute admin invoice URL without a duplicate slash', () => {
  assert.equal(
    buildAdminInvoiceUrl('https://carkhodro.com/', 'order-123'),
    'https://carkhodro.com/admin/orders/order-123',
  );
});

test('retail notification contains buyer, amount, and invoice link', () => {
  const body = buildAdminOrderNotificationMessage({
    kind: 'RETAIL_PAYMENT',
    buyerFullName: 'علی رضایی',
    amountToman: BigInt(1250000),
    invoiceUrl: 'https://carkhodro.com/admin/orders/order-123',
  });

  assert.match(body, /پرداخت آنلاین جدید/);
  assert.match(body, /خریدار: علی رضایی/);
  assert.match(body, /۱٬۲۵۰٬۰۰۰ تومان/);
  assert.match(body, /https:\/\/carkhodro\.com\/admin\/orders\/order-123/);
});

test('wholesale notification uses the invoice-created title', () => {
  const body = buildAdminOrderNotificationMessage({
    kind: 'WHOLESALE_INVOICE',
    buyerFullName: 'مریم احمدی',
    amountToman: BigInt(800000),
    invoiceUrl: 'https://carkhodro.com/admin/orders/order-456',
  });

  assert.match(body, /فاکتور همکاری جدید/);
  assert.match(body, /خریدار: مریم احمدی/);
  assert.match(body, /۸۰۰٬۰۰۰ تومان/);
  assert.match(body, /https:\/\/carkhodro\.com\/admin\/orders\/order-456/);
});
