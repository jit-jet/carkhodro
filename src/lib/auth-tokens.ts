/**
 * Short-lived signed tokens — server-only.
 * ─────────────────────────────────────────
 * Bridges the gap between "OTP verified" and "profile completed" for *new*
 * users: after a new phone passes OTP we can't create a `User` row yet (the
 * schema requires first/last name), so we hand the browser a tamper-proof
 * `verified_phone` cookie. The signup action trusts the phone only if this
 * token validates — preventing someone from POSTing `registerUser` with an
 * unverified number.
 *
 * Format: `<value>.<expiresAtMs>.<hmac>` (HMAC-SHA256 over `value.expiresAtMs`).
 */

import crypto from 'node:crypto';

const SECRET = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-me';

/** Sign a value with an absolute expiry (ms from now). */
export function signToken(value: string, ttlMs: number): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${value}.${expiresAt}`;
  const mac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${mac}`;
}

/** Return the signed value if the token is intact and unexpired, else null. */
export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [value, expiresAtRaw, mac] = parts;

  const payload = `${value}.${expiresAtRaw}`;
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const a = Buffer.from(mac, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return value;
}
