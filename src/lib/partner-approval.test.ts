import assert from 'node:assert/strict';
import test from 'node:test';
import { applyRoleToProduct, type ProductVM } from './serializers';
import { canUseRetailCheckout, canUseDashboardCart } from './user-role';
import { isCallForPriceForRole } from './call-for-price';

test('pending applicants cannot purchase in either checkout', () => {
  assert.equal(canUseRetailCheckout('WHOLESALE_PENDING'), false);
  assert.equal(canUseDashboardCart('WHOLESALE_PENDING'), false);
  assert.equal(canUseRetailCheckout('RETAIL'), true);
  assert.equal(canUseRetailCheckout(null), true);
  assert.equal(canUseDashboardCart('WHOLESALE'), true);
});

test('pending prices and raw pricing fields are removed without modifying the shared catalogue', () => {
  const product = {
    wholesalePrice: 100_000, cashDiscountPct: 5, retailPriceDiffPct: 25,
    retailDiscountPct: 10, callForPriceRetail: false, callForPriceWholesale: false,
    stock: 2, price: 113_000, oldPrice: 125_000, discount: 10,
  } as ProductVM;
  const pending = applyRoleToProduct(product, 'WHOLESALE_PENDING');
  assert.equal(pending.pendingApproval, true);
  assert.equal(pending.callForPrice, true);
  for (const key of ['price', 'wholesalePrice', 'cashDiscountPct', 'retailPriceDiffPct', 'retailDiscountPct'] as const) {
    assert.equal(pending[key], 0);
  }
  assert.equal(pending.oldPrice, undefined);
  assert.equal(pending.discount, undefined);
  assert.equal(pending.cashDiscount, undefined);
  assert.equal(product.wholesalePrice, 100_000);
  assert.equal(applyRoleToProduct(product, 'WHOLESALE').price, 100_000);
  assert.equal(applyRoleToProduct(product, 'RETAIL').price, 113_000);
  assert.equal(isCallForPriceForRole(product, 'WHOLESALE_PENDING'), true);
});
