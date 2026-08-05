/**
 * Clears a stale auth cookie and redirects.
 *
 * Used when the browser still has `session_token` / `admin_session_token` but
 * the DB session was revoked (e.g. admin deactivated the user). Without this,
 * the proxy's cookie-only gate and page-level `redirect('/login')` fight each
 * other in a refresh loop.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/src/lib/session';
import { ADMIN_SESSION_COOKIE } from '@/src/lib/admin-session';
import { safeInternalPath } from '@/src/lib/safe-internal-path';

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get('kind');
  const fallback = kind === 'admin' ? '/admin/login' : '/login';
  const next = safeInternalPath(request.nextUrl.searchParams.get('next'), fallback);

  const response = NextResponse.redirect(new URL(next, request.url));
  const cookie = kind === 'admin' ? ADMIN_SESSION_COOKIE : SESSION_COOKIE;
  response.cookies.set(cookie, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
