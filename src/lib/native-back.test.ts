import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveNativeBackAction } from './native-back';

test('exits from the home page even when the WebView has browser history', () => {
  assert.equal(resolveNativeBackAction('/', true), 'exit');
  assert.equal(resolveNativeBackAction('/', false), 'exit');
});

test('preserves back and minimize behavior outside the home page', () => {
  assert.equal(resolveNativeBackAction('/products', true), 'back');
  assert.equal(resolveNativeBackAction('/products', false), 'minimize');
});
