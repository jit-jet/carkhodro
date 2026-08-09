'use server';

/**
 * Admin authentication Server Actions — username + password.
 * ─────────────────────────────────────────────────────────
 * Deliberately separate from `actions/auth.ts` (customer/partner SMS-OTP
 * flow): the admin panel needs a classic username/password login with no
 * dependency on the SMS gateway, and its own session cookie
 * (`src/lib/admin-session.ts`).
 */

import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { verifyPassword } from '@/src/lib/password';
import { createAdminSession, destroyAdminSession, getCurrentAdmin } from '@/src/lib/admin-session';

const MAX_FAILED_ADMIN_LOGINS = 5;
const ADMIN_LOCKOUT_MS = 60 * 60 * 1000;
const INVALID_CREDENTIALS = 'نام کاربری یا رمز عبور اشتباه است.';
const LOCKED_ACCOUNT = 'حساب مدیریت به‌دلیل تلاش‌های ناموفق موقتاً قفل شده است. لطفاً یک ساعت دیگر دوباره تلاش کنید.';

export async function adminLogin(
  username: string,
  password: string,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('adminLogin', async () => {
    const login = username.trim();
    if (!login || !password) {
      return fail('نام کاربری و رمز عبور الزامی است.');
    }

    const user = await prisma.user.findUnique({ where: { username: login } });
    // Same generic error for "no such user" and "wrong password" — avoids
    // leaking which admin usernames exist.
    if (!user || user.role !== 'ADMIN') {
      return fail(INVALID_CREDENTIALS);
    }

    const now = new Date();
    if (user.adminLockedUntil && user.adminLockedUntil > now) {
      return fail(LOCKED_ACCOUNT);
    }

    // An elapsed lock starts a fresh sequence; its first wrong password must
    // count as attempt 1, not extend the previous lock immediately.
    if (user.adminLockedUntil) {
      await prisma.user.updateMany({
        where: { id: user.id, adminLockedUntil: { lte: now } },
        data: { failedAdminLoginAttempts: 0, adminLockedUntil: null },
      });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const failed = await prisma.user.update({
        where: { id: user.id },
        data: { failedAdminLoginAttempts: { increment: 1 } },
        select: { failedAdminLoginAttempts: true },
      });
      if (failed.failedAdminLoginAttempts >= MAX_FAILED_ADMIN_LOGINS) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedAdminLoginAttempts: MAX_FAILED_ADMIN_LOGINS,
            adminLockedUntil: new Date(Date.now() + ADMIN_LOCKOUT_MS),
          },
        });
        return fail(LOCKED_ACCOUNT);
      }
      return fail(INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      return fail('حساب کاربری شما غیرفعال شده است. لطفاً با ادمین در ارتباط باشید.');
    }

    if (user.failedAdminLoginAttempts !== 0 || user.adminLockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedAdminLoginAttempts: 0, adminLockedUntil: null },
      });
    }

    await createAdminSession(user.id);
    return ok({ id: user.id });
  });
}

export async function adminLogout(): Promise<ActionResult> {
  return runMutation('adminLogout', async () => {
    await destroyAdminSession();
    return ok(undefined);
  });
}

/** Current admin's display info for the topbar — null if not signed in. */
export async function getCurrentAdminInfo(): Promise<{
  id: string;
  fullName: string;
  username: string;
} | null> {
  const admin = await getCurrentAdmin();
  if (!admin || !admin.username) return null;
  return {
    id: admin.id,
    fullName: `${admin.firstName} ${admin.lastName}`.trim(),
    username: admin.username,
  };
}
