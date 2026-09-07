import assert from 'node:assert/strict';
import test from 'node:test';
import { wholesaleFromHesabfaItem } from './product-pricing';
import type { HesabfaItem } from './types';

test('uses SellPrice as wholesale_price even when a price list has a different value', () => {
  const item: HesabfaItem = {
    Code: '004916',
    Name: 'کمک عقب پراید دوگانه گازی ایران',
    SellPrice: 50_000,
    PriceList: [
      { Title: 'عمده', Currency: 'IRR', Price: 28_550_000 },
      { Title: 'همکار', Currency: 'IRR', Price: 28_550_000 },
    ],
  };

  assert.equal(wholesaleFromHesabfaItem(item), BigInt(5_000));
});

test('maps a missing SellPrice to zero instead of falling back to PriceList', () => {
  const item: HesabfaItem = {
    Code: 'test',
    Name: 'test',
    SellPrice: null,
    PriceList: [{ Title: 'عمده', Currency: 'IRR', Price: 28_550_000 }],
  };

  assert.equal(wholesaleFromHesabfaItem(item), BigInt(0));
});
