import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeOtpCode } from './otp-autofill';

test('normalizes SMS and keyboard digits without taking other text', () => {
  assert.equal(normalizeOtpCode('1234'), '1234');
  assert.equal(normalizeOtpCode('۱۲۳۴'), '1234');
  assert.equal(normalizeOtpCode('١٢٣٤'), '1234');
  assert.equal(normalizeOtpCode('کد ورود: ۱۲۳۴'), '1234');
  assert.equal(normalizeOtpCode('123456'), '1234');
});
