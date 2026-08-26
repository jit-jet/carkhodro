import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHesabfaWebhookPayload } from './webhook-payload';

test('parses and deduplicates Hesabfa documented hook ids', () => {
  assert.deepEqual(
    parseHesabfaWebhookPayload({
      Password: 'secret',
      Action: 52,
      ObjectType: 'Product',
      ObjectIdList: [10, '10', 11],
    }),
    {
      Password: 'secret',
      Action: 52,
      ObjectType: 'Product',
      ObjectIdList: [10, 11],
    },
  );
});

test('rejects undocumented object types and malformed ids', () => {
  assert.equal(
    parseHesabfaWebhookPayload({
      Password: 'secret',
      Action: 261,
      ObjectType: 'WarehouseReceipt',
      ObjectIdList: [10],
    }),
    null,
  );
  assert.equal(
    parseHesabfaWebhookPayload({
      Password: 'secret',
      Action: 52,
      ObjectType: 'Product',
      ObjectIdList: [0, 'bad'],
    }),
    null,
  );
});
