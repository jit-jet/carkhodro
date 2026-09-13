import assert from 'node:assert/strict';
import test from 'node:test';
import {
  planContactIdentitySync,
  type LocalContactIdentity,
} from './contact-identity';
import { contactPrimaryMobile } from './phone';

function user(
  id: string,
  phoneNumber: string,
  role = 'WHOLESALE',
  hesabfaCode: string | null = null,
  hesabfaId: number | null = null,
): LocalContactIdentity {
  return { id, role, phoneNumber, hesabfaCode, hesabfaId };
}

test('creates a wholesale account for an unambiguous new Hesabfa person', () => {
  const contact = { code: '10', mobile: '09121234567', hesabfaId: 5 };
  const plan = planContactIdentitySync([contact], []);

  assert.deepEqual(plan.toCreate, [contact]);
  assert.equal(plan.skipped, 0);
});

test('ignores every Hesabfa person that shares a duplicate mobile', () => {
  const plan = planContactIdentitySync(
    [
      { code: '10', mobile: '09121234567', hesabfaId: 5 },
      { code: '11', mobile: '09121234567', hesabfaId: 6 },
    ],
    [],
  );

  assert.deepEqual(plan.toCreate, []);
  assert.deepEqual(plan.toUpdate, []);
  assert.equal(plan.skipped, 2);
});

test('updates an existing wholesale account but never overwrites a retail phone', () => {
  const wholesale = { code: '10', mobile: '09120000001', hesabfaId: 5 };
  const retailConflict = { code: '11', mobile: '09120000002', hesabfaId: 6 };
  const plan = planContactIdentitySync(
    [wholesale, retailConflict],
    [
      user('wholesale', '09120000001', 'WHOLESALE', '10', 5),
      user('retail', '09120000002', 'RETAIL'),
    ],
  );

  assert.deepEqual(plan.toUpdate, [{ id: 'wholesale', contact: wholesale }]);
  assert.equal(plan.skipped, 1);
});

test('keeps the code owner and releases a recycled numeric id', () => {
  const contact = { code: '10', mobile: '09120000001', hesabfaId: 5 };
  const plan = planContactIdentitySync(
    [contact],
    [
      user('code-owner', '09120000001', 'WHOLESALE', '10', 7),
      user('stale-id-owner', '09120000002', 'WHOLESALE', '11', 5),
    ],
  );

  assert.deepEqual(plan.toUpdate, [{ id: 'code-owner', contact }]);
  assert.deepEqual(plan.hesabfaIdsToRelease, [
    { userId: 'stale-id-owner', hesabfaId: 5 },
  ]);
});

test('phone fallback matches the same wholesale account without creating another', () => {
  const mobile = contactPrimaryMobile({ Mobile: null, Phone: '+98 912 123 4567' });
  assert.equal(mobile, '09121234567');
  const contact = { code: '10', mobile, hesabfaId: 5 };
  const plan = planContactIdentitySync(
    [contact],
    [user('existing', '09121234567')],
  );
  assert.deepEqual(plan.toUpdate, [{ id: 'existing', contact }]);
  assert.deepEqual(plan.toCreate, []);
});

test('phone fallback upgrades an invoice placeholder linked by Hesabfa code', () => {
  const mobile = contactPrimaryMobile({ Mobile: '', Phone: '09121234567' });
  assert.equal(mobile, '09121234567');
  const contact = { code: '10', mobile, hesabfaId: 5 };
  const plan = planContactIdentitySync(
    [contact],
    [user('invoice-owner', 'hesabfa:10', 'WHOLESALE', '10')],
  );
  assert.deepEqual(plan.toUpdate, [{ id: 'invoice-owner', contact }]);
  assert.deepEqual(plan.toCreate, []);
});

test('phone fallback cannot take a retail account mobile', () => {
  const mobile = contactPrimaryMobile({ Mobile: null, Phone: '09121234567' });
  assert.equal(mobile, '09121234567');
  const plan = planContactIdentitySync(
    [{ code: '10', mobile, hesabfaId: 5 }],
    [user('retail-owner', mobile, 'RETAIL')],
  );
  assert.equal(plan.skipped, 1);
  assert.deepEqual(plan.toCreate, []);
  assert.deepEqual(plan.toUpdate, []);
});

test('mobile and phone fallback sharing one number are ambiguous', () => {
  const mobile = contactPrimaryMobile({ Mobile: '09121234567', Phone: null });
  const fallback = contactPrimaryMobile({ Mobile: '', Phone: '۹۱۲۱۲۳۴۵۶۷' });
  assert.equal(mobile, fallback);
  const plan = planContactIdentitySync([
    { code: '10', mobile: mobile!, hesabfaId: 5 },
    { code: '11', mobile: fallback!, hesabfaId: 6 },
  ], []);
  assert.equal(plan.skipped, 2);
  assert.deepEqual(plan.toCreate, []);
});
