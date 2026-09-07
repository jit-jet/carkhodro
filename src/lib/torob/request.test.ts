import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTorobProductRequest } from '@/src/lib/torob/request';

test('accepts each Torob v3 request mode', () => {
  assert.deepEqual(parseTorobProductRequest({ page: 2, sort: 'date_updated_desc' }), {
    ok: true,
    request: { kind: 'page', page: 2, sort: 'date_updated_desc' },
  });
  assert.equal(parseTorobProductRequest({ page_urls: ['https://example.com/products/1'] }).ok, true);
  assert.equal(parseTorobProductRequest({ page_uniques: ['product-1'] }).ok, true);
});

test('rejects defaults, empty lookups, and mixed request modes', () => {
  assert.equal(parseTorobProductRequest({}).ok, false);
  assert.equal(parseTorobProductRequest({ page: 1 }).ok, false);
  assert.equal(parseTorobProductRequest({ page_urls: [] }).ok, false);
  assert.equal(parseTorobProductRequest({ page_urls: ['   '] }).ok, false);
  assert.equal(parseTorobProductRequest({ page_urls: ['/products/1'] }).ok, false);
  assert.equal(parseTorobProductRequest({ page_uniques: ['1'], unknown: true }).ok, false);
  assert.equal(
    parseTorobProductRequest({ page: 1, sort: 'date_added_desc', page_uniques: ['1'] }).ok,
    false,
  );
});
