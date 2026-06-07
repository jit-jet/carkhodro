/**
 * Session helper — resolves the current user from the session cookie.
 *
 * Reads the `session_token` cookie, looks up a non-expired `Session` row and
 * returns the owning `User` (or null). Because it touches `cookies()` it is a
 * request-time API and must NOT be called inside a `use cache` scope — read it
 * in an uncached Server Component / Action and pass values down as arguments.
 */

import { cookies } from 'next/headers';
import { prisma } from '@/src/lib/prisma';
import type { User } from '@/generated/prisma_client';

export const SESSION_COOKIE = 'session_token';

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) return null;
    return session.user;
  } catch (err) {
    console.error('[session:getCurrentUser]', err);
    return null;
  }
}
