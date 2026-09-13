import assert from 'node:assert/strict';
import test from 'node:test';

import { contactPrimaryMobile, mobileLookupVariants, normalizeIranMobile } from './phone';

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

test('prefers Mobile and uses Phone only when Mobile is absent', () => {
  assert.equal(contactPrimaryMobile({ Mobile: '+98 912 123 4567', Phone: '09351112233' }), '09121234567');
  assert.equal(contactPrimaryMobile({ Mobile: '  ', Phone: '۹۳۵۱۱۲۲۳۳۴' }), '09351122334');
  assert.equal(contactPrimaryMobile({ Mobile: null, Phone: '0098-912-123-4567' }), '09121234567');
  assert.equal(contactPrimaryMobile({ Mobile: '', Phone: '02112345678' }), null);
  assert.equal(contactPrimaryMobile({ Mobile: 'invalid', Phone: '09121234567' }), null);
});

test('includes canonical and original values for exact Hesabfa lookups', () => {
  assert.deepEqual(mobileLookupVariants('09121234567', ' ۰۹۱۲ ۱۲۳ ۴۵۶۷ '), [
    '۰۹۱۲ ۱۲۳ ۴۵۶۷', '09121234567', '9121234567',
    '989121234567', '+989121234567', '00989121234567',
  ]);
});
