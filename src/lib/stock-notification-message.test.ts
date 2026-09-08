import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStockNotificationMessage } from './stock-notification-message';

test('stock SMS follows the requested format and links to the product', () => {
  const message = buildStockNotificationMessage({
    productName: '  فیلتر   روغن\nبوش  ',
    productUrl: 'https://carkhodro.example/products/product-۱۲٣',
  });

  assert.equal(
    message,
    [
      'فروشگاه اینترنتی کارخودرو',
      '',
      'محصول «فیلتر روغن بوش» موجود شد.',
      'همین حالا می‌توانید سفارش خود را ثبت کنید.',
      'https://carkhodro.example/products/product-123',
    ].join('\n'),
  );
});
