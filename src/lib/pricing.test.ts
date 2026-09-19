import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyRetailDiscount,
  computeRetailPrice,
  netLineTotalBigIntForRole,
  netLineTotalForOrder,
  resolveProductPrice,
  roundRetailPrice,
} from './pricing';

test('rounds retail prices to the nearest 1,000 Toman', () => {
  assert.equal(roundRetailPrice(12_499), 12_000);
  assert.equal(roundRetailPrice(12_500), 13_000);
  assert.equal(roundRetailPrice(12_501), 13_000);
  assert.equal(roundRetailPrice(13_000), 13_000);
});

test('keeps imported invoice prices without retail tier rounding', () => {
  assert.equal(netLineTotalForOrder(12_345, 2, 0, 'RETAIL', true), 24_690);
  assert.equal(netLineTotalForOrder(12_345, 2, 0, 'RETAIL', false), 24_000);
});

test('rounds both the retail list price and discounted price', () => {
  const fields = {
    wholesalePrice: 100_399,
    cashDiscountPct: 0 as never,
    retailPriceDiffPct: 25 as never,
    retailDiscountPct: 10 as never,
  };

  assert.equal(computeRetailPrice(fields), 125_000);
  assert.equal(applyRetailDiscount(125_000, 10), 113_000);
});

test('uses the same retail rounding policy for persisted BigInt line totals', () => {
  assert.equal(netLineTotalBigIntForRole(BigInt(125_000), 2, 10, 'RETAIL'), BigInt(226_000));
  assert.equal(netLineTotalBigIntForRole(BigInt(125_000), 2, 10, 'WHOLESALE'), BigInt(225_000));
});

test('cash discount labels never reduce wholesale prices or order line totals', () => {
  const fields = {
    wholesalePrice: 100_000,
    cashDiscountPct: 5,
    retailPriceDiffPct: 25,
    retailDiscountPct: 10,
  };
  assert.deepEqual(resolveProductPrice(fields, 'WHOLESALE'), {
    basePrice: 100_000,
    discountPct: 0,
    finalPrice: 100_000,
  });
  assert.equal(netLineTotalBigIntForRole(BigInt(100_000), 3, 0, 'WHOLESALE'), BigInt(300_000));
  assert.equal(resolveProductPrice(fields, 'RETAIL').finalPrice, 113_000);
});
