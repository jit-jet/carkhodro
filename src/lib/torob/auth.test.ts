import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';
import { verifyTorobJwt } from '@/src/lib/torob/auth';

function jwt(
  privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'],
  payload: Record<string, unknown>,
  algorithm = 'EdDSA',
): string {
  const header = Buffer.from(JSON.stringify({ alg: algorithm, typ: 'JWT', v: 1 })).toString(
    'base64url',
  );
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(null, Buffer.from(`${header}.${body}`), privateKey).toString('base64url');
  return `${header}.${body}.${signature}`;
}

test('verifies EdDSA signature, audience, exp, and nbf', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const token = jwt(privateKey, { aud: 'shop.example', nbf: 900, exp: 1100 });

  assert.equal(
    verifyTorobJwt(token, 'shop.example', { publicKey, nowSeconds: 1000 }),
    true,
  );
  assert.equal(
    verifyTorobJwt(token, 'other.example', { publicKey, nowSeconds: 1000 }),
    false,
  );
  assert.equal(
    verifyTorobJwt(token, 'shop.example', { publicKey, nowSeconds: 1100 }),
    false,
  );
  assert.equal(
    verifyTorobJwt(token, 'shop.example', { publicKey, nowSeconds: 899 }),
    false,
  );
});

test('rejects tampered and non-EdDSA tokens', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const token = jwt(privateKey, { aud: 'shop.example', nbf: 900, exp: 1100 });
  const [header, body, signature] = token.split('.');
  const tamperedBody = Buffer.from(
    JSON.stringify({ aud: 'shop.example', nbf: 900, exp: 1200 }),
  ).toString('base64url');

  assert.equal(
    verifyTorobJwt(`${header}.${tamperedBody}.${signature}`, 'shop.example', {
      publicKey,
      nowSeconds: 1000,
    }),
    false,
  );
  assert.equal(
    verifyTorobJwt(jwt(privateKey, { aud: 'shop.example', nbf: 900, exp: 1100 }, 'none'), 'shop.example', {
      publicKey,
      nowSeconds: 1000,
    }),
    false,
  );
  assert.ok(body);
});
