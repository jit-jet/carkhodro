import assert from 'node:assert/strict';
import test from 'node:test';
import { applyRoleToProduct, type ProductVM } from './serializers';

test('cash discount is a wholesale badge without changing the displayed price', () => {
  const product = {
    wholesalePrice: 100_000,
    cashDiscountPct: 5,
    retailPriceDiffPct: 25,
    retailDiscountPct: 10,
    callForPriceRetail: false,
    callForPriceWholesale: false,
    stock: 2,
  } as ProductVM;

  const wholesale = applyRoleToProduct(product, 'WHOLESALE');
  assert.equal(wholesale.price, 100_000);
  assert.equal(wholesale.oldPrice, undefined);
  assert.equal(wholesale.discount, undefined);
  assert.equal(wholesale.cashDiscount, 5);

  const retail = applyRoleToProduct(product, 'RETAIL');
  assert.equal(retail.price, 113_000);
  assert.equal(retail.oldPrice, 125_000);
  assert.equal(retail.discount, 10);
  assert.equal(retail.cashDiscount, undefined);
});
