/**
 * Proxy (this Next.js version's renamed `middleware`).
 * ────────────────────────────────────────────────────
 * Optimistic auth gate: bounces signed-out visitors away from account-only
 * routes before they render. It only checks for the *presence* of the session
 * cookie — fast, and runs on every matched request including prefetches — so it
 * deliberately does NOT hit the database. The authoritative check still happens
 * in the Server Actions / data layer (`getCurrentUser`), which is the real line
 * of defense; this is purely a UX redirect.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Inlined (not imported from `src/lib/session`) so the proxy bundle stays free
// of Prisma/`pg` — per the Proxy guidance to avoid shared modules. Keep in sync
// with `SESSION_COOKIE` there.
const SESSION_COOKIE = 'session_token';

/** Routes that require a logged-in customer/partner. */
const PROTECTED_PREFIXES = ['/dashboard', '/checkout', '/wishlist'];

// Kept in sync with `ADMIN_SESSION_COOKIE` in `src/lib/admin-session.ts`. A
// separate cookie from `SESSION_COOKIE` so an admin login never collides with
// (or gets confused for) a customer/partner session in the same browser.
const ADMIN_SESSION_COOKIE = 'admin_session_token';
const ADMIN_LOGIN_PATH = '/admin/login';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === ADMIN_LOGIN_PATH) {
    // Already-authenticated admins skip straight past the login screen.
    const hasAdminSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (hasAdminSession) return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const hasAdminSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (hasAdminSession) return NextResponse.next();

    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  // Send to login and come back to the originally requested page afterwards.
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/checkout/:path*', '/wishlist', '/admin/:path*'],
};
