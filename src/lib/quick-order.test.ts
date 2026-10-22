import assert from 'node:assert/strict';
import test from 'node:test';
import { quickOrderQuantity, quickOrderRowIndex } from './quick-order';

test('quick ordering rejects malformed quantities and enforces the viewer quantity cap', () => {
  for (const input of ['', '0', '-1', '1.5', '2e3', 'Infinity', '9007199254740992']) {
    assert.equal(quickOrderQuantity(input, null), null, input);
  }
  assert.equal(quickOrderQuantity('3', 2), null);
  assert.equal(quickOrderQuantity('2', 2), 2);
  assert.equal(quickOrderQuantity('250', null), 250);
  assert.equal(quickOrderQuantity('1', 0), null);
});

test('row navigation handles empty results and stops at table boundaries', () => {
  assert.equal(quickOrderRowIndex(0, 1, 0), -1);
  assert.equal(quickOrderRowIndex(-1, 1, 12), 0);
  assert.equal(quickOrderRowIndex(0, -1, 12), 0);
  assert.equal(quickOrderRowIndex(11, 1, 12), 11);
  assert.equal(quickOrderRowIndex(4, 1, 12), 5);
  assert.equal(quickOrderRowIndex(4, -1, 12), 3);
});
