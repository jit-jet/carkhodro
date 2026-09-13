import assert from 'node:assert/strict';
import test from 'node:test';
import { contactBalanceRial } from './contact-balance';

test('uses the net debit or credit returned by Hesabfa in Rial', () => {
  assert.equal(contactBalanceRial({ Liability: -407_000, Credits: 35_000 }), 372_000);
  assert.equal(contactBalanceRial({ Liability: 500_000, Credits: 100_000 }), 400_000);
  assert.equal(contactBalanceRial({ Liability: -100_000, Credits: 500_000 }), -400_000);
  assert.equal(contactBalanceRial({ Liability: 100_000, Credits: 500_000 }), -400_000);
  assert.equal(contactBalanceRial({ Liability: 0, Credits: 0 }), 0);
});

test('does not treat missing or invalid Hesabfa amounts as zero', () => {
  assert.equal(contactBalanceRial(null), null);
  assert.equal(contactBalanceRial({ Liability: 0 }), null);
  assert.equal(contactBalanceRial({ Liability: Number.NaN, Credits: 0 }), null);
});
