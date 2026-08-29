import assert from 'node:assert/strict';
import test from 'node:test';
import { readHesabfaWebhookRequest } from './webhook-request';

function webhookRequest(password: string): Request {
  return new Request('https://example.test/api/hesabfa/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      Password: password,
      Action: 52,
      ObjectType: 'Product',
      ObjectIdList: [10],
    }),
  });
}

test('authenticates webhook requests only with HESABFA_HOOK_PASSWORD', async () => {
  const previous = process.env.HESABFA_HOOK_PASSWORD;

  try {
    process.env.HESABFA_HOOK_PASSWORD = '  env-secret  ';
    assert.deepEqual(await readHesabfaWebhookRequest(webhookRequest('env-secret')), {
      ok: true,
      payload: {
        Password: 'env-secret',
        Action: 52,
        ObjectType: 'Product',
        ObjectIdList: [10],
      },
    });

    assert.deepEqual(await readHesabfaWebhookRequest(webhookRequest('database-secret')), {
      ok: false,
      error: 'unauthorized',
      status: 401,
    });

    delete process.env.HESABFA_HOOK_PASSWORD;
    assert.deepEqual(await readHesabfaWebhookRequest(webhookRequest('env-secret')), {
      ok: false,
      error: 'unauthorized',
      status: 401,
    });
  } finally {
    if (previous === undefined) delete process.env.HESABFA_HOOK_PASSWORD;
    else process.env.HESABFA_HOOK_PASSWORD = previous;
  }
});
