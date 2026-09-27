import assert from 'node:assert/strict';
import test from 'node:test';
import type { ProductVM } from '@/src/lib/serializers';
import {
  filterAndSortProductVMs,
  productBrowseInputFromParams,
} from '@/src/lib/product-browse';

function product(
  id: string,
  overrides: Partial<ProductVM> = {},
): ProductVM {
  return {
    id,
    name: id,
    brandSlug: 'brand-a',
    carBrandSlugs: ['car-brand-a'],
    carTypes: ['car-a'],
    category: 'category-a',
    isOffer: false,
    stock: 1,
    createdDate: '2026-01-01',
    salesCount: 0,
    viewCount: 0,
    ...overrides,
  } as ProductVM;
}

test('builds a browse input from repeated URL filters', () => {
  assert.deepEqual(
    productBrowseInputFromParams({
      q: '  لنت ترمز  ',
      brand: ['brand-a', 'brand-b'],
      carBrand: 'car-brand-a',
      car: ['car-a', 'car-b'],
      category: 'brake',
      offer: '1',
      sort: 'best_selling',
    }),
    {
      page: 1,
      query: 'لنت ترمز',
      brands: ['brand-a', 'brand-b'],
      carBrands: ['car-brand-a'],
      carTypes: ['car-a', 'car-b'],
      categories: ['brake'],
      offerOnly: true,
      sort: 'best_selling',
    },
  );
});

test('defaults relevance to newest outside search', () => {
  assert.equal(productBrowseInputFromParams({ sort: 'relevance' }).sort, 'newest');
  assert.equal(productBrowseInputFromParams({ q: 'پژو' }).sort, 'relevance');
});

test('filters every selected facet and keeps in-stock products first', () => {
  const input = productBrowseInputFromParams({
    brand: 'brand-a',
    carBrand: 'car-brand-a',
    car: 'car-a',
    category: 'category-a',
    offer: '1',
    sort: 'newest',
  });
  const result = filterAndSortProductVMs([
    product('old-in-stock', { isOffer: true, createdDate: '2025-01-01' }),
    product('new-out-of-stock', { isOffer: true, stock: 0, createdDate: '2026-02-01' }),
    product('wrong-brand', { isOffer: true, brandSlug: 'brand-b' }),
    product('new-in-stock', { isOffer: true, createdDate: '2026-01-01' }),
  ], input);

  assert.deepEqual(result.map((item) => item.id), [
    'new-in-stock',
    'old-in-stock',
    'new-out-of-stock',
  ]);
});
