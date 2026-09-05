import assert from 'node:assert/strict';
import test from 'node:test';
import { orderQuantityCapForRole, resolveOrderQtyUI } from './order-quantity';
import { clampOrderQuantity } from './user-role';

test('zero and negative stock are unavailable for retail and wholesale users', () => {
  for (const stock of [0, -1]) {
    assert.equal(orderQuantityCapForRole(stock, 'RETAIL'), 0);
    const wholesaleCap = orderQuantityCapForRole(stock, 'WHOLESALE');
    assert.equal(wholesaleCap, 0);
    assert.deepEqual(resolveOrderQtyUI({ stock, orderQuantityCap: wholesaleCap }), {
      inStock: false,
      stockCapped: false,
      maxQty: null,
    });
  }
});

test('positive stock caps retail quantity but leaves wholesale quantity unlimited', () => {
  assert.equal(orderQuantityCapForRole(4, 'RETAIL'), 4);
  assert.equal(orderQuantityCapForRole(4, 'WHOLESALE'), null);
  assert.deepEqual(resolveOrderQtyUI({ stock: 4, orderQuantityCap: 4 }), {
    inStock: true,
    stockCapped: true,
    maxQty: 4,
  });
  assert.deepEqual(resolveOrderQtyUI({ stock: 4, orderQuantityCap: null }), {
    inStock: true,
    stockCapped: false,
    maxQty: null,
  });
  assert.equal(clampOrderQuantity(10, 4, 'RETAIL'), 4);
  assert.equal(clampOrderQuantity(10, 4, 'WHOLESALE'), 10);
});
