import assert from 'node:assert/strict';
import test from 'node:test';
import { androidAppRedirect, isAndroidAppUserAgent, shouldOpenAndroidDashboard } from './native-app';

test('identifies only the Android app user agent', () => {
  assert.equal(isAndroidAppUserAgent('Mozilla/5.0 (Linux; Android 14) CarkhodroCapacitor/1'), true);
  assert.equal(isAndroidAppUserAgent('Mozilla/5.0 (Linux; Android 14)'), false);
  assert.equal(isAndroidAppUserAgent('Mozilla/5.0 (iPhone) CarkhodroCapacitor/1'), false);
  assert.equal(isAndroidAppUserAgent(null), false);
});

test('routes Android guests to login and partners to dashboard on launch', () => {
  assert.equal(androidAppRedirect('/', null), '/login');
  assert.equal(androidAppRedirect('/products', null), '/login');
  assert.equal(androidAppRedirect('/login', null), null);
  assert.equal(androidAppRedirect('/api/auth/clear-session', null), null);
  assert.equal(androidAppRedirect('/', 'WHOLESALE'), null);
  assert.equal(androidAppRedirect('/login', 'WHOLESALE'), '/dashboard');
  assert.equal(androidAppRedirect('/products', 'WHOLESALE'), null);
});

test('opens the dashboard once while leaving later home navigation alone', () => {
  assert.equal(shouldOpenAndroidDashboard('/', true, false), true);
  assert.equal(shouldOpenAndroidDashboard('/', false, false), false);
  assert.equal(shouldOpenAndroidDashboard('/products', true, false), false);
  assert.equal(shouldOpenAndroidDashboard('/', true, true), false);
});

test('keeps non-partner accounts off app pages', () => {
  assert.equal(androidAppRedirect('/dashboard', 'RETAIL'), '/login');
  assert.equal(androidAppRedirect('/login', 'RETAIL'), null);
  assert.equal(androidAppRedirect('/dashboard', 'ADMIN'), '/login');
});
