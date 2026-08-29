import crypto from 'node:crypto';
import { getHesabfaHookPassword } from './env';
import type { HesabfaWebhookPayload } from './types';
import { parseHesabfaWebhookPayload } from './webhook-payload';

export type HesabfaWebhookRequestResult =
  | { ok: true; payload: HesabfaWebhookPayload }
  | { ok: false; error: 'invalid_json' | 'invalid_payload' | 'unauthorized'; status: 400 | 401 };

function secretsEqual(expected: string, supplied: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return (
    expectedBytes.length === suppliedBytes.length &&
    crypto.timingSafeEqual(expectedBytes, suppliedBytes)
  );
}

/** Decode and authenticate a Hesabfa change-hook request. */
export async function readHesabfaWebhookRequest(
  request: Request,
): Promise<HesabfaWebhookRequestResult> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return { ok: false, error: 'invalid_json', status: 400 };
  }

  const payload = parseHesabfaWebhookPayload(value);
  if (!payload) return { ok: false, error: 'invalid_payload', status: 400 };

  const expected = getHesabfaHookPassword();
  if (!expected || !secretsEqual(expected, payload.Password)) {
    return { ok: false, error: 'unauthorized', status: 401 };
  }

  return { ok: true, payload };
}
