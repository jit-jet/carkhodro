/**
 * OTP primitives — server-only.
 * ─────────────────────────────
 * Generates, hashes, and compares the SMS one-time password. The code itself is
 * never stored: only an HMAC-SHA256 hash lands in `otp_sessions.code_hash`
 * (matching the schema comment "Bcrypt-hashed in production"). We use Node's
 * built-in `crypto` (no extra dependency) with `SESSION_SECRET` as the key, and
 * a constant-time comparison to avoid leaking the code through timing.
 *
 * All policy knobs (length, TTL, attempt/resend limits) live here so the auth
 * action reads as a flat flow.
 */

import crypto from 'node:crypto';

// ── Policy ──────────────────────────────────────────────────────────────────

/** 4 digits — matches the 4-box input in `OtpStep.tsx` (CODE_LENGTH). */
export const OTP_LENGTH = 4;
/** Hard expiry: reject the code after this window even if it matches. */
export const OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes
/** Max wrong-code guesses before the session is burned and a new code needed. */
export const OTP_MAX_VERIFY_ATTEMPTS = 5;
/** Min seconds between two "send code" requests for the same number. */
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60s — mirrors the client timer

const SECRET = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-me';

// ── Code generation / hashing ───────────────────────────────────────────────

/** Cryptographically-random numeric code, zero-padded to OTP_LENGTH digits. */
export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH; // e.g. 10000
  return String(crypto.randomInt(0, max)).padStart(OTP_LENGTH, '0');
}

/** Deterministic, keyed hash of a code — safe to persist. */
export function hashOtpCode(code: string): string {
  return crypto.createHmac('sha256', SECRET).update(code.trim()).digest('hex');
}

/** Constant-time check that `code` hashes to `storedHash`. */
export function verifyOtpCode(code: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashOtpCode(code), 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}
