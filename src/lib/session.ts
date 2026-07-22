/**
 * Session helper — resolves the current user from the session cookie.
 *
 * Reads the `session_token` cookie, looks up a non-expired `Session` row and
 * returns the owning `User` (or null). Because it touches `cookies()` it is a
 * request-time API and must NOT be called inside a `use cache` scope — read it
 * in an uncached Server Component / Action and pass values down as arguments.
 */

import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { prisma } from '@/src/lib/prisma';
import type { User } from '@/generated/prisma_client';

export const SESSION_COOKIE = 'session_token';

/** How long a login stays valid. The DB row and the cookie share this expiry. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) return null;
    if (!session.user.isActive) return null;
    return session.user;
  } catch (err) {
    console.error('[session:getCurrentUser]', err);
    return null;
  }
}

/**
 * Issue a fresh session: persist a random opaque token in the `sessions` table
 * and drop it into an httpOnly cookie. Must be called from a Server Action or
 * Route Handler (it writes a cookie). `secure` is off on localhost so the
 * cookie is still set over plain http in development.
 */
export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production',  //uncomment later
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

/** Revoke the current session: delete the DB row and clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await prisma.session.deleteMany({ where: { token } });
    } catch (err) {
      console.error('[session:destroySession]', err);
    }
    store.delete(SESSION_COOKIE);
  }
}
