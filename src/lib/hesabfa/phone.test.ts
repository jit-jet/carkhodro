import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeIranMobile } from './phone';

test('normalizes equivalent Iranian mobile formats', () => {
  assert.equal(normalizeIranMobile('0912 123 4567'), '09121234567');
  assert.equal(normalizeIranMobile('+98 912 123 4567'), '09121234567');
  assert.equal(normalizeIranMobile('0098-912-123-4567'), '09121234567');
});

test('rejects missing and invalid phone numbers', () => {
  assert.equal(normalizeIranMobile(null), null);
  assert.equal(normalizeIranMobile(undefined), null);
  assert.equal(normalizeIranMobile(''), null);
  assert.equal(normalizeIranMobile('02112345678'), null);
});
