import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyRetailDiscount,
  computeRetailPrice,
  netLineTotalBigIntForRole,
  roundRetailPrice,
} from './pricing';

test('rounds retail prices to the nearest 1,000 Toman', () => {
  assert.equal(roundRetailPrice(12_499), 12_000);
  assert.equal(roundRetailPrice(12_500), 13_000);
  assert.equal(roundRetailPrice(12_501), 13_000);
  assert.equal(roundRetailPrice(13_000), 13_000);
});

test('rounds both the retail list price and discounted price', () => {
  const fields = {
    wholesalePrice: 100_399,
    wholesaleDiscountPct: 0 as never,
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
