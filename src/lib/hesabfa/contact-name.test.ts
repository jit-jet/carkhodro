import assert from 'node:assert/strict';
import test from 'node:test';
import { displayName } from './contact-name';

const contact = (name = '', fields = {}) => ({ Code: '1', Name: name, ...fields });

test('keeps missing Hesabfa name fields empty', () => {
  assert.deepEqual(displayName(contact()), { firstName: '', lastName: '' });
  assert.deepEqual(displayName(contact('', { FirstName: 'علی' })), {
    firstName: 'علی',
    lastName: '',
  });
  assert.deepEqual(displayName(contact('', { LastName: 'رضایی' })), {
    firstName: '',
    lastName: 'رضایی',
  });
});

test('splits the combined Hesabfa name without adding a last-name placeholder', () => {
  assert.deepEqual(displayName(contact('علی رضایی')), {
    firstName: 'علی',
    lastName: 'رضایی',
  });
  assert.deepEqual(displayName(contact('علی')), {
    firstName: 'علی',
    lastName: '',
  });
});
