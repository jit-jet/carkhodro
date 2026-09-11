import assert from 'node:assert/strict';
import test from 'node:test';
import { toTorobProduct, type TorobProductSource } from '@/src/lib/torob/products';

function source(overrides: Partial<TorobProductSource> = {}): TorobProductSource {
  return {
    id: 'product_1',
    sku: 'SKU-1',
    name: 'لنت ترمز',
    wholesalePrice: BigInt(100_000),
    wholesaleDiscountPct: 0 as never,
    retailPriceDiffPct: 25 as never,
    retailDiscountPct: 10 as never,
    stock: 4,
    origin: 'ایران',
    unit: 'عدد',
    mainImage: '/storage/products/main.jpg',
    description: '<p>توضیح کوتاه محصول</p>',
    metaDescription: null,
    createdAt: new Date('2026-01-01T10:00:00+03:30'),
    updatedAt: new Date('2026-01-02T10:00:00+03:30'),
    partsBrand: { name: 'ایساکو' },
    category: { name: 'ترمز' },
    images: [
      { url: '/storage/products/gallery.jpg' },
      { url: '/storage/products/main.jpg' },
    ],
    compatibilities: [{ carModel: { name: 'پژو ۲۰۶' } }],
    ...overrides,
  };
}

test('maps the existing retail price and product data to Torob v3', () => {
  const product = toTorobProduct(source(), 'https://shop.example/');

  assert.equal(product.page_unique, 'product_1');
  assert.equal(product.page_url, 'https://shop.example/products/product_1');
  assert.equal(product.current_price, 113_000);
  assert.equal(product.old_price, 125_000);
  assert.equal(product.availability, true);
  assert.deepEqual(product.image_links, [
    'https://shop.example/storage/products/main.jpg',
    'https://shop.example/storage/products/gallery.jpg',
  ]);
  assert.equal(product.short_desc, 'توضیح کوتاه محصول');
  assert.equal(product.spec['کد کالا'], 'SKU-1');
  assert.equal(product.spec['خودروهای سازگار'], 'پژو ۲۰۶');
});

test('reports unavailable products with a zero current price', () => {
  const product = toTorobProduct(source({ stock: 0 }), 'https://shop.example/');

  assert.equal(product.availability, false);
  assert.equal(product.current_price, 0);
  assert.equal(product.old_price, undefined);
});
