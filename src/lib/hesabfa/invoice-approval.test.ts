import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HESABFA_INVOICE_STATUS_APPROVED,
  HESABFA_INVOICE_STATUS_DRAFT,
  hesabfaInvoiceStatusForRole,
} from './invoice-approval';

test('creates wholesale dashboard invoices as drafts in Hesabfa', () => {
  assert.equal(hesabfaInvoiceStatusForRole('WHOLESALE'), HESABFA_INVOICE_STATUS_DRAFT);
});

test('keeps retail invoices approved in Hesabfa', () => {
  assert.equal(hesabfaInvoiceStatusForRole('RETAIL'), HESABFA_INVOICE_STATUS_APPROVED);
});
