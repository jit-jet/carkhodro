'use server';

/**
 * Authentication Server Actions — phone + SMS OTP.
 * ────────────────────────────────────────────────
 * This is the real backend that replaces the old mock in `src/lib/authApi.ts`
 * and `src/data/mockUsers.ts`. File-level `'use server'`, so the auth UI (client
 * components) can import these directly. Everything is per-request / dynamic and
 * never cached.
 *
 * Flow:
 *   1. requestOtp(phone)        → generate code, hash + store in `otp_sessions`,
 *                                 "send" it (console in dev, SMS provider in prod).
 *   2. verifyOtp(phone, code)   → check hash/expiry/attempts. On success:
 *                                   • existing user → create session + merge cart
 *                                   • new user      → issue a signed `verified_phone`
 *                                                     cookie so signup can trust it.
 *   3. registerUser(profile)    → only if `verified_phone` matches; create the
 *                                 User + default Address, session, merge cart.
 *   4. logout()                 → revoke session.
 *
 * Security: OTP codes are HMAC-hashed (never stored in clear), expire after 2
 * minutes, are single-use, rate-limited on send (60s cooldown) and capped at 5
 * wrong guesses before the code is burned.
 */

import { cookies } from 'next/headers';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { createSession, destroySession } from '@/src/lib/session';
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpCode,
  OTP_TTL_MS,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
} from '@/src/lib/otp';
import { signToken, verifyToken } from '@/src/lib/auth-tokens';
import { mergeGuestCartIntoUser } from '@/src/lib/guest-cart';
import { resolveLocation } from '@/src/lib/resolve-location';

const PHONE_RE = /^09\d{9}$/;
const VERIFIED_PHONE_COOKIE = 'verified_phone';
const VERIFIED_PHONE_TTL_MS = 15 * 60 * 1000; // window to finish the signup form

const isDev = process.env.NODE_ENV !== 'production';

// ── Result payload types (mirror the old authApi shapes the UI expects) ──────

export interface RequestOtpData {
  /** Dev-only: the plain code, so the UI can surface it without a real SMS. */
  devCode?: string;
}

export interface VerifyOtpData {
  /** true → phone already has an account (logged in now); false → go to signup. */
  userExists: boolean;
}

export interface RegisterInput {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  provinceId: number | null;
  cityId: number | null;
  address: string;
  postalCode: string;
}

// ── SMS delivery (swap the console stub for a real provider in prod) ─────────

async function deliverOtp(phoneNumber: string, code: string): Promise<void> {
  // ── PRODUCTION ──────────────────────────────────────────────────────────
  // Example (Kavenegar — a popular Iranian SMS gateway):
  //
  //   if (process.env.SMS_PROVIDER === 'kavenegar') {
  //     await fetch(
  //       `https://api.kavenegar.com/v1/${process.env.SMS_API_KEY}/verify/lookup.json` +
  //         `?receptor=${phoneNumber}&token=${code}&template=carkhodro-otp`,
  //       { method: 'POST' },
  //     );
  //     return;
  //   }
  // ─────────────────────────────────────────────────────────────────────────

  // ── DEV ───────────────────────────────────────────────────────────────────
  // No real SMS: log the code so it can be read from the server console.
  console.info(`[otp] code for ${phoneNumber}: ${code} (dev — no SMS sent)`);
}

// ── 1. Request OTP ───────────────────────────────────────────────────────────

export async function requestOtp(
  phoneNumber: string,
): Promise<ActionResult<RequestOtpData>> {
  return runMutation('requestOtp', async () => {
    const phone = phoneNumber.trim();
    if (!PHONE_RE.test(phone)) {
      return fail('شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).');
    }

    // Rate-limit: block a resend that arrives inside the cooldown window.
    const existing = await prisma.otpSession.findUnique({ where: { phoneNumber: phone } });
    if (
      existing &&
      Date.now() - existing.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      const wait = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.createdAt.getTime())) / 1000,
      );
      return fail(`لطفاً ${wait} ثانیه دیگر دوباره تلاش کنید.`);
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // One active OTP per number. `attempts` here counts *verify* tries; reset to
    // 0 on each new send. `createdAt` is set to now to track the last send time.
    await prisma.otpSession.upsert({
      where: { phoneNumber: phone },
      create: { phoneNumber: phone, codeHash: hashOtpCode(code), expiresAt, attempts: 0 },
      update: {
        codeHash: hashOtpCode(code),
        expiresAt,
        attempts: 0,
        createdAt: new Date(),
      },
    });

    await deliverOtp(phone, code);

    return ok<RequestOtpData>({ ...(isDev ? { devCode: code } : {}) });
  });
}

// ── 2. Verify OTP ────────────────────────────────────────────────────────────

export async function verifyOtp(
  phoneNumber: string,
  code: string,
): Promise<ActionResult<VerifyOtpData>> {
  return runMutation('verifyOtp', async () => {
    const phone = phoneNumber.trim();
    if (!PHONE_RE.test(phone)) return fail('شماره موبایل معتبر نیست.');

    const session = await prisma.otpSession.findUnique({ where: { phoneNumber: phone } });
    if (!session) return fail('کدی برای این شماره ثبت نشده است. ابتدا کد تأیید بگیرید.');

    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.otpSession.delete({ where: { phoneNumber: phone } });
      return fail('کد منقضی شده است. لطفاً کد جدید درخواست کنید.');
    }

    if (session.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      await prisma.otpSession.delete({ where: { phoneNumber: phone } });
      return fail('تعداد تلاش‌های مجاز به پایان رسید. کد جدید بگیرید.');
    }

    if (!verifyOtpCode(code, session.codeHash)) {
      await prisma.otpSession.update({
        where: { phoneNumber: phone },
        data: { attempts: { increment: 1 } },
      });
      return fail('کد وارد شده اشتباه است.');
    }

    // Correct code → consume it (single-use).
    await prisma.otpSession.delete({ where: { phoneNumber: phone } });

    const user = await prisma.user.findUnique({ where: { phoneNumber: phone } });

    if (user) {
      // Existing account → log in immediately and absorb any guest cart.
      if (!user.isVerified) {
        await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
      }
      await createSession(user.id);
      await mergeGuestCartIntoUser(user.id);
      return ok<VerifyOtpData>({ userExists: true });
    }

    // New number → hand the browser a signed proof so signup can trust it.
    (await cookies()).set(
      VERIFIED_PHONE_COOKIE,
      signToken(phone, VERIFIED_PHONE_TTL_MS),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: VERIFIED_PHONE_TTL_MS / 1000,
        path: '/',
      },
    );
    return ok<VerifyOtpData>({ userExists: false });
  });
}

// ── 3. Register (new user finishes their profile) ────────────────────────────

export async function registerUser(
  input: RegisterInput,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('registerUser', async () => {
    const phone = input.phoneNumber.trim();

    // The phone must have been OTP-verified within the last 15 minutes.
    const verifiedPhone = verifyToken((await cookies()).get(VERIFIED_PHONE_COOKIE)?.value);
    if (!verifiedPhone || verifiedPhone !== phone) {
      return fail('شماره تأیید نشده است. لطفاً دوباره وارد شوید.');
    }

    // Server-side validation (mirrors the client form).
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const street = input.address.trim();
    const postalCode = input.postalCode.trim();
    if (!firstName) return fail('نام الزامی است.');
    if (!lastName) return fail('نام خانوادگی الزامی است.');
    if (!input.provinceId) return fail('استان الزامی است.');
    if (!input.cityId) return fail('شهر الزامی است.');
    if (!street) return fail('آدرس الزامی است.');
    if (!/^\d{10}$/.test(postalCode)) return fail('کد پستی باید دقیقاً ۱۰ رقم باشد.');

    // Idempotency: if the account already exists, just sign them in.
    const existing = await prisma.user.findUnique({ where: { phoneNumber: phone } });
    if (existing) {
      await createSession(existing.id);
      (await cookies()).delete(VERIFIED_PHONE_COOKIE);
      await mergeGuestCartIntoUser(existing.id);
      return ok({ id: existing.id });
    }

    const resolved = await resolveLocation(input.provinceId, input.cityId);
    if (!resolved.ok) return fail(resolved.error);
    const city = resolved.city;

    // Create the user + their default delivery address atomically.
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { phoneNumber: phone, firstName, lastName, isVerified: true },
        select: { id: true },
      });
      await tx.address.create({
        data: {
          userId: created.id,
          cityId: city.id,
          street,
          postalCode,
          isDefault: true,
        },
      });
      return created;
    });

    await createSession(user.id);
    (await cookies()).delete(VERIFIED_PHONE_COOKIE);
    await mergeGuestCartIntoUser(user.id);

    return ok({ id: user.id });
  });
}

// ── 4. Logout ────────────────────────────────────────────────────────────────

export async function logout(): Promise<ActionResult> {
  return runMutation('logout', async () => {
    await destroySession();
    return ok(undefined);
  });
}
