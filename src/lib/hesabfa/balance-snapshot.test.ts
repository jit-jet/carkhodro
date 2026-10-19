import assert from 'node:assert/strict';
import test from 'node:test';
import { captureAccountBalanceSnapshotRial } from './balance-snapshot';

const partner = { role: 'WHOLESALE', hesabfaCode: '000873' };

test('retail snapshot is zero and never contacts accounting', async () => {
  assert.equal(await captureAccountBalanceSnapshotRial(
    { role: 'RETAIL', hesabfaCode: null },
    async () => { throw new Error('must not fetch'); },
  ), BigInt(0));
});

test('captures signed Rial balances using the dashboard calculation', async () => {
  for (const [Liability, Credits, expected] of [
    [-407000, 35000, 372000], [100000, 500000, -400000], [0, 0, 0],
  ]) {
    assert.equal(await captureAccountBalanceSnapshotRial(partner, async code => {
      assert.equal(code, partner.hesabfaCode);
      return { Code: code, Name: 'test', Liability, Credits };
    }), BigInt(expected));
  }
});

test('each registration captures its own balance without changing earlier snapshots', async () => {
  let liability = 1000;
  const read = async () => ({ Code: '000873', Name: 'test', Liability: liability, Credits: 0 });
  const first = await captureAccountBalanceSnapshotRial(partner, read);
  liability = 3000;
  const second = await captureAccountBalanceSnapshotRial(partner, read);
  assert.equal(first, BigInt(1000));
  assert.equal(second, BigInt(3000));
});

test('missing or invalid balance prevents registration instead of storing false zero', async () => {
  await assert.rejects(captureAccountBalanceSnapshotRial({ ...partner, hesabfaCode: null }, async () => null));
  await assert.rejects(captureAccountBalanceSnapshotRial(partner, async () => null));
  for (const Liability of [NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(captureAccountBalanceSnapshotRial(partner, async () => ({
      Code: '000873', Name: 'test', Liability, Credits: 0,
    })));
  }
  await assert.rejects(captureAccountBalanceSnapshotRial(partner, async () => { throw new Error('API unavailable'); }));
});
