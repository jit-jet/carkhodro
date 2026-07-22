/**
 * Admin session helper — mirrors `src/lib/session.ts` but on a dedicated
 * cookie (`admin_session_token`) and table row, so a signed-in admin never
 * shares state with a signed-in customer/partner session in the same browser.
 * Reuses the generic `Session` table (it's just `token` → `userId`, agnostic
 * of role) rather than introducing a parallel schema.
 *
 * As with `session.ts`, this touches `cookies()` — request-time only, never
 * call it inside a `use cache` scope.
 */

import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { prisma } from '@/src/lib/prisma';
import type { User } from '@/generated/prisma_client';

export const ADMIN_SESSION_COOKIE = 'admin_session_token';

const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours — shorter than the storefront's 30 days

/** Resolves the current session to a `User`, or `null` if absent/expired/not an admin. */
export async function getCurrentAdmin(): Promise<User | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) return null;
    if (session.user.role !== 'ADMIN') return null;
    if (!session.user.isActive) return null;
    return session.user;
  } catch (err) {
    console.error('[admin-session:getCurrentAdmin]', err);
    return null;
  }
}

export async function createAdminSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production', // uncomment once served over https
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    try {
      await prisma.session.deleteMany({ where: { token } });
    } catch (err) {
      console.error('[admin-session:destroyAdminSession]', err);
    }
    store.delete(ADMIN_SESSION_COOKIE);
  }
}
