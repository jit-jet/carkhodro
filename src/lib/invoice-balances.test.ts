import assert from 'node:assert/strict';
import test from 'node:test';
import { invoiceBalances, type InvoiceBalanceInput } from './invoice-balances';

const order: InvoiceBalanceInput = {
  role: 'WHOLESALE',
  source: 'ONLINE',
  accountBalanceSnapshotRial: BigInt(100_000_000),
  totalAmount: BigInt(2_000_000),
};

test('approval changes the label without adding the invoice a second time', () => {
  const draft = invoiceBalances(order, 0);
  const approved = invoiceBalances(order, 1);
  for (const result of [draft, approved]) {
    assert.equal(result.accountBalanceBeforeInvoiceRial, 100_000_000);
    assert.equal(result.accountBalanceRial, 120_000_000);
  }
  assert.equal(draft.accountBalanceLabel, 'مانده با احتساب این فاکتور');
  assert.match(draft.accountBalanceNote!, /هنوز/);
  assert.equal(approved.accountBalanceLabel, 'مانده پس از فاکتور');
  assert.match(approved.accountBalanceNote!, /تأیید شده/);
});

test('signed credit and zero balances offset the invoice in Rial', () => {
  assert.equal(invoiceBalances({ ...order, accountBalanceSnapshotRial: BigInt(-30_000_000) }, 0).accountBalanceRial, -10_000_000);
  assert.equal(invoiceBalances({ ...order, accountBalanceSnapshotRial: BigInt(-20_000_000) }, 1).accountBalanceRial, 0);
  assert.equal(invoiceBalances({ ...order, accountBalanceSnapshotRial: BigInt(0) }, 0).accountBalanceRial, 20_000_000);
});

test('missing or unrecognized approval never claims the balance is approved', () => {
  for (const status of [undefined, 2]) {
    const result = invoiceBalances(order, status);
    assert.equal(result.accountBalanceRial, 120_000_000);
    assert.equal(result.accountBalanceLabel, 'مانده با احتساب این فاکتور');
    assert.match(result.accountBalanceNote!, /وضعیت تأیید حسابداری در دسترس نیست/);
  }
});

test('imports retain the captured balance without adding or subtracting the invoice', () => {
  for (const status of [0, 1, undefined]) {
    const result = invoiceBalances({ ...order, source: 'OFFLINE' }, status);
    assert.equal(result.accountBalanceBeforeInvoiceRial, null);
    assert.equal(result.accountBalanceRial, 100_000_000);
    assert.equal(result.accountBalanceLabel, 'مانده حساب هنگام دریافت از حسابفا');
  }
});

test('legacy missing snapshots stay unavailable instead of inventing a balance', () => {
  for (const source of ['ONLINE', 'OFFLINE']) {
    const result = invoiceBalances({ ...order, source, accountBalanceSnapshotRial: null }, 1);
    assert.equal(result.accountBalanceBeforeInvoiceRial, null);
    assert.equal(result.accountBalanceRial, null);
  }
});

test('retail invoices keep their zero balance', () => {
  const result = invoiceBalances({ ...order, role: 'RETAIL' }, 1);
  assert.equal(result.accountBalanceBeforeInvoiceRial, 0);
  assert.equal(result.accountBalanceRial, 0);
  assert.equal(result.accountBalanceNote, null);
});
