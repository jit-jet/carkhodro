import assert from 'node:assert/strict';
import test from 'node:test';
import { HESABFA_ACTION } from './types';
import { classifyHesabfaWebhookAction } from './webhook-actions';

test('uses the documented contact action codes', () => {
  assert.equal(HESABFA_ACTION.CONTACT_SAVE, 31);
  assert.equal(HESABFA_ACTION.CONTACT_EDIT, 32);
  assert.equal(HESABFA_ACTION.CONTACT_DELETE, 33);
  assert.equal(classifyHesabfaWebhookAction('Contact', 31), 'upsert');
  assert.equal(classifyHesabfaWebhookAction('Contact', 32), 'upsert');
  assert.equal(classifyHesabfaWebhookAction('Contact', 33), 'delete');
});

test('uses the documented product action codes', () => {
  assert.equal(classifyHesabfaWebhookAction('Product', 51), 'upsert');
  assert.equal(classifyHesabfaWebhookAction('Product', 52), 'upsert');
  assert.equal(classifyHesabfaWebhookAction('Product', 53), 'delete');
  assert.equal(classifyHesabfaWebhookAction('Product', 101), 'upsert');
});

test('handles documented invoice save, edit, and delete action families', () => {
  for (const action of [121, 122, 131, 132, 141, 142, 151, 152, 161, 162]) {
    assert.equal(classifyHesabfaWebhookAction('Invoice', action), 'upsert');
  }
  for (const action of [123, 133, 143, 153, 163]) {
    assert.equal(classifyHesabfaWebhookAction('Invoice', action), 'delete');
  }
});

test('includes every remaining documented hook action code', () => {
  assert.deepEqual(
    [
      HESABFA_ACTION.RECEIVE_RECEIPT_SAVE,
      HESABFA_ACTION.RECEIVE_RECEIPT_EDIT,
      HESABFA_ACTION.RECEIVE_RECEIPT_DELETE,
      HESABFA_ACTION.PAYMENT_RECEIPT_SAVE,
      HESABFA_ACTION.PAYMENT_RECEIPT_EDIT,
      HESABFA_ACTION.PAYMENT_RECEIPT_DELETE,
      HESABFA_ACTION.WAREHOUSE_RECEIPT_SAVE,
      HESABFA_ACTION.WAREHOUSE_RECEIPT_EDIT,
      HESABFA_ACTION.WAREHOUSE_RECEIPT_DELETE,
      HESABFA_ACTION.ONLINE_INVOICE_PAYMENT_SAVE,
      HESABFA_ACTION.ONLINE_CONTACT_DEPOSIT_SAVE,
    ],
    [181, 182, 183, 191, 192, 193, 261, 262, 263, 500, 501],
  );
});

test('ignores unsupported object/action combinations', () => {
  assert.equal(classifyHesabfaWebhookAction('Product', 32), 'ignore');
  assert.equal(classifyHesabfaWebhookAction('Contact', 52), 'ignore');
  assert.equal(classifyHesabfaWebhookAction('Invoice', 500), 'ignore');
  assert.equal(classifyHesabfaWebhookAction('Unknown', 52), 'ignore');
});
