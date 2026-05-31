/**
 * Auth API Service
 * ─────────────────
 * THE ONLY MODULE THAT TALKS TO THE AUTH BACKEND.
 *
 * All UI components import from here — never from mockUsers.ts directly.
 * This enforces a clean separation so that replacing the mock with a real
 * backend requires changes in this file only.
 *
 * HOW TO MIGRATE TO A REAL BACKEND
 *   1. Set NEXT_PUBLIC_API_URL in your .env.local.
 *   2. Uncomment each "── PRODUCTION ──" block.
 *   3. Delete each "── MOCK ──" block.
 *   4. Delete src/data/mockUsers.ts (no longer needed).
 *
 * Response shapes already mirror standard REST API conventions, so the
 * real fetch() calls should be near drop-in replacements.
 */

import {
  dbFindUserByPhone,
  dbCreateOtpSession,
  dbVerifyOtpSession,
  dbConsumeOtpSession,
  dbCreateUser,
  type User,
} from '@/src/data/mockUsers';

// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''; // ← set in .env.local for prod

// ── Response types ─────────────────────────────────────────────────────────────
// These mirror the JSON body your real API endpoints would return.

export interface SendOtpResponse {
  ok: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  ok: boolean;
  /**
   * true  → phone is registered → redirect to /dashboard
   * false → phone is new        → redirect to /signup
   */
  userExists: boolean;
  message: string;
}

export interface RegisterResponse {
  ok: boolean;
  user: User | null;
  message: string;
}

// ── sendOtp ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/send-otp
 * Requests a one-time password for the given phone number.
 * The SMS provider sends the code to the user's handset.
 */
export async function sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
  // ── PRODUCTION ────────────────────────────────────────────────────────────
  //
  // Example with Kavenegar (popular Iranian SMS provider):
  //
  // const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ phoneNumber }),
  // });
  // if (!res.ok) {
  //   const err = await res.json().catch(() => ({}));
  //   return { ok: false, message: err.message ?? 'خطا در ارسال کد تأیید' };
  // }
  // return { ok: true, message: 'کد تأیید ارسال شد.' };
  //
  // ─────────────────────────────────────────────────────────────────────────

  // ── MOCK ─────────────────────────────────────────────────────────────────
  await simulateLatency(450);
  const code = dbCreateOtpSession(phoneNumber);
  // This alert replaces the real SMS — remove it when connecting a real provider.
  alert(
    `📱 پیامک ارسال شد (حالت توسعه)\n\nکد تأیید: ${code}\n\n` +
    `⚠️ در محیط واقعی این کد از طریق پیامک ارسال می‌شود.`
  );
  return { ok: true, message: 'کد تأیید ارسال شد.' };
  // ─────────────────────────────────────────────────────────────────────────
}

// ── verifyOtp ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/verify-otp
 * Validates the code and tells the caller whether the user is already registered.
 */
export async function verifyOtp(
  phoneNumber: string,
  code: string
): Promise<VerifyOtpResponse> {
  // ── PRODUCTION ────────────────────────────────────────────────────────────
  //
  // const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ phoneNumber, code }),
  // });
  // const data = await res.json().catch(() => ({}));
  // return {
  //   ok: res.ok,
  //   userExists: Boolean(data.userExists),
  //   message: data.message ?? (res.ok ? 'کد تأیید شد.' : 'خطا'),
  // };
  //
  // ─────────────────────────────────────────────────────────────────────────

  // ── MOCK ─────────────────────────────────────────────────────────────────
  await simulateLatency(500);
  const valid = dbVerifyOtpSession(phoneNumber, code);
  if (!valid) {
    return {
      ok: false,
      userExists: false,
      message: 'کد وارد شده اشتباه یا منقضی شده است.',
    };
  }
  dbConsumeOtpSession(phoneNumber); // enforce single-use
  const userExists = dbFindUserByPhone(phoneNumber) !== null;
  return {
    ok: true,
    userExists,
    message: 'کد با موفقیت تأیید شد.',
  };
  // ─────────────────────────────────────────────────────────────────────────
}

// ── registerUser ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new user account with the provided profile information.
 */
export async function registerUser(
  data: Omit<User, 'id' | 'createdAt'>
): Promise<RegisterResponse> {
  // ── PRODUCTION ────────────────────────────────────────────────────────────
  //
  // const res = await fetch(`${BASE_URL}/api/auth/register`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
  // const json = await res.json().catch(() => ({}));
  // return {
  //   ok: res.ok,
  //   user: json.user ?? null,
  //   message: json.message ?? (res.ok ? 'ثبت‌نام انجام شد.' : 'خطا'),
  // };
  //
  // ─────────────────────────────────────────────────────────────────────────

  // ── MOCK ─────────────────────────────────────────────────────────────────
  await simulateLatency(600);
  if (dbFindUserByPhone(data.phoneNumber)) {
    return { ok: false, user: null, message: 'این شماره قبلاً ثبت‌نام کرده است.' };
  }
  const user = dbCreateUser(data);
  return { ok: true, user, message: 'ثبت‌نام با موفقیت انجام شد.' };
  // ─────────────────────────────────────────────────────────────────────────
}

// ── Utility ───────────────────────────────────────────────────────────────────

/** Simulates network round-trip. Remove entirely in production. */
function simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
