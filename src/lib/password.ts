/**
 * Password hashing — server-only.
 * ────────────────────────────────
 * Used only for admin/back-office logins (`User.passwordHash`); storefront
 * customers keep authenticating with SMS OTP (see `src/lib/otp.ts`) and never
 * get a password. Built on Node's built-in `crypto.scrypt` (no extra
 * dependency, mirrors the project's existing preference for built-in `crypto`
 * over adding a package for `otp.ts`/`auth-tokens.ts`).
 *
 * Stored format: `scrypt:<saltHex>:<hashHex>`.
 */

import crypto from 'node:crypto';

const KEY_LENGTH = 64;

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/** Hash a plaintext password into the `scrypt:<salt>:<hash>` stored format. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt);
  return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
}

/** Constant-time verification of a plaintext password against a stored hash. */
export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  if (!storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, saltHex, hashHex] = parts;

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = await scrypt(password, salt);
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
