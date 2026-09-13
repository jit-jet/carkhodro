import assert from 'node:assert/strict';
import test from 'node:test';
import { formatInvoiceNumber, normalizeInvoiceNumber } from './invoice-number';

test('shows the exact Hesabfa number, preserving leading zeroes', () => {
  assert.equal(formatInvoiceNumber('00123'), '۰۰۱۲۳');
  assert.equal(formatInvoiceNumber('A-012'), 'A-۰۱۲');
  assert.equal(formatInvoiceNumber(null), 'در انتظار صدور');
});

test('searches Hesabfa invoice numbers with Persian or Arabic digits', () => {
  assert.equal(normalizeInvoiceNumber(' ۰۰۱۲۳ '), '00123');
  assert.equal(normalizeInvoiceNumber('٠٠١٢٣'), '00123');
});
