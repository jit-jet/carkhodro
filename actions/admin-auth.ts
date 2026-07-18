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
      return fail('نام کاربری یا رمز عبور اشتباه است.');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return fail('نام کاربری یا رمز عبور اشتباه است.');
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
