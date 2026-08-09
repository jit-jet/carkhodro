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
import { recordAdminLoginAttempt } from '@/src/lib/admin-audit';

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
    async function loginFailure(
      message: string,
      status: 'FAILURE' | 'BLOCKED',
      reason: 'invalid_credentials' | 'locked' | 'inactive',
      actorId?: string,
    ): Promise<ActionResult<never>> {
      await recordAdminLoginAttempt({
        actorId,
        attemptedUsername: login,
        status,
        reason,
      });
      return fail(message);
    }

    if (!login || !password) {
      return loginFailure('نام کاربری و رمز عبور الزامی است.', 'FAILURE', 'invalid_credentials');
    }

    const user = await prisma.user.findUnique({ where: { username: login } });
    // Same generic error for "no such user" and "wrong password" — avoids
    // leaking which admin usernames exist.
    if (!user || user.role !== 'ADMIN') {
      return loginFailure(INVALID_CREDENTIALS, 'FAILURE', 'invalid_credentials');
    }

    const now = new Date();
    if (user.adminLockedUntil && user.adminLockedUntil > now) {
      return loginFailure(LOCKED_ACCOUNT, 'BLOCKED', 'locked', user.id);
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
        return loginFailure(LOCKED_ACCOUNT, 'BLOCKED', 'locked', user.id);
      }
      return loginFailure(INVALID_CREDENTIALS, 'FAILURE', 'invalid_credentials', user.id);
    }

    if (!user.isActive) {
      return loginFailure(
        'حساب کاربری شما غیرفعال شده است. لطفاً با ادمین در ارتباط باشید.',
        'FAILURE',
        'inactive',
        user.id,
      );
    }

    if (user.failedAdminLoginAttempts !== 0 || user.adminLockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedAdminLoginAttempts: 0, adminLockedUntil: null },
      });
    }

    await createAdminSession(user.id);
    await recordAdminLoginAttempt({
      actorId: user.id,
      attemptedUsername: login,
      status: 'SUCCESS',
      reason: 'success',
    });
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
