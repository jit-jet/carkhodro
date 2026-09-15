import assert from 'node:assert/strict';
import test from 'node:test';
import { androidAppRedirect, isAndroidAppUserAgent } from './native-app';

test('identifies only the Android app user agent', () => {
  assert.equal(isAndroidAppUserAgent('Mozilla/5.0 (Linux; Android 14) CarkhodroCapacitor/1'), true);
  assert.equal(isAndroidAppUserAgent('Mozilla/5.0 (Linux; Android 14)'), false);
  assert.equal(isAndroidAppUserAgent('Mozilla/5.0 (iPhone) CarkhodroCapacitor/1'), false);
  assert.equal(isAndroidAppUserAgent(null), false);
});

test('requires Android app guests to log in and lets partners use app routes', () => {
  assert.equal(androidAppRedirect('/', null), '/login');
  assert.equal(androidAppRedirect('/products', null), '/login');
  assert.equal(androidAppRedirect('/login', null), null);
  assert.equal(androidAppRedirect('/api/auth/clear-session', null), null);
  assert.equal(androidAppRedirect('/', 'WHOLESALE'), null);
  assert.equal(androidAppRedirect('/login', 'WHOLESALE'), '/dashboard');
  assert.equal(androidAppRedirect('/products', 'WHOLESALE'), null);
});

test('keeps non-partner accounts off app pages', () => {
  assert.equal(androidAppRedirect('/dashboard', 'RETAIL'), '/login');
  assert.equal(androidAppRedirect('/login', 'RETAIL'), null);
  assert.equal(androidAppRedirect('/dashboard', 'ADMIN'), '/login');
});
