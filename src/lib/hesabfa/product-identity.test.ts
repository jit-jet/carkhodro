import assert from 'node:assert/strict';
import test from 'node:test';
import {
  planProductIdentitySync,
  type LocalProductIdentity,
} from './product-identity';

function row(
  id: string,
  sku: string,
  hesabfaCode: string | null,
  hesabfaId: number | null,
): LocalProductIdentity {
  return { id, sku, hesabfaCode, hesabfaId };
}

test('keeps an exact code and numeric-id match on the same product', () => {
  const item = { code: '100', hesabfaId: 10 };
  const plan = planProductIdentitySync([item], [row('a', '100', '100', 10)]);

  assert.deepEqual(plan.toUpdate, [{ id: 'a', item }]);
  assert.deepEqual(plan.hesabfaIdsToRelease, []);
  assert.equal(plan.skipped, 0);
});

test('keeps the code owner and releases a recycled numeric id', () => {
  const item = { code: '006356', hesabfaId: 3144 };
  const plan = planProductIdentitySync(
    [item],
    [
      row('catalogue-product', '006356', '006356', 10656),
      row('deleted-test-product', '001123', '001123', 3144),
    ],
  );

  assert.deepEqual(plan.toUpdate, [{ id: 'catalogue-product', item }]);
  assert.deepEqual(plan.hesabfaIdsToRelease, [
    { productId: 'deleted-test-product', hesabfaId: 3144 },
  ]);
});

test('releases both old owners before cross-swapping numeric ids', () => {
  const first = { code: 'A', hesabfaId: 2 };
  const second = { code: 'B', hesabfaId: 1 };
  const plan = planProductIdentitySync(
    [first, second],
    [row('a', 'A', 'A', 1), row('b', 'B', 'B', 2)],
  );

  assert.deepEqual(plan.toUpdate, [
    { id: 'a', item: first },
    { id: 'b', item: second },
  ]);
  assert.deepEqual(plan.hesabfaIdsToRelease, [
    { productId: 'b', hesabfaId: 2 },
    { productId: 'a', hesabfaId: 1 },
  ]);
});

test('falls back to the numeric id when no local code matches', () => {
  const item = { code: 'NEW-CODE', hesabfaId: 10 };
  const plan = planProductIdentitySync([item], [row('a', 'OLD-CODE', 'OLD-CODE', 10)]);

  assert.deepEqual(plan.toUpdate, [{ id: 'a', item }]);
  assert.deepEqual(plan.hesabfaIdsToRelease, []);
});

test('skips a second incoming item that claims the same numeric id', () => {
  const first = { code: 'A', hesabfaId: 10 };
  const second = { code: 'B', hesabfaId: 10 };
  const plan = planProductIdentitySync([first, second], []);

  assert.deepEqual(plan.toCreate, [first]);
  assert.equal(plan.skipped, 1);
});
