/**
 * Proxy (this Next.js version's renamed `middleware`).
 * ────────────────────────────────────────────────────
 * Optimistic auth gate: bounces signed-out visitors away from account-only
 * routes before they render. It only checks for the *presence* of the session
 * cookie — fast, and runs on every matched request including prefetches — so it
 * deliberately does NOT hit the database. It does NOT bounce cookie-holders
 * away from /login|/signup|/admin/login: a revoked session still leaves an
 * httpOnly cookie, and optimistic redirects caused a refresh loop with
 * page-level `redirect('/login')`. Those pages validate the DB session and
 * clear a stale cookie via `/api/auth/clear-session`.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/src/lib/prisma';

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

/** Auth pages that signed-in customers should not see. */
const AUTH_PAGES = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Deliberately public Hesabfa test receiver/page. It must accept server-to-
  // server POSTs without an admin session; see app/admin/hook/route.ts.
  if (pathname === '/admin/hook') return NextResponse.next();

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    const source = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
    try {
      const redirect = await prisma.seoRedirect.findUnique({ where: { source }, select: { destination: true, statusCode: true } });
      if (redirect && redirect.destination !== source) {
        return NextResponse.redirect(new URL(redirect.destination, request.url), redirect.statusCode === 302 ? 302 : 301);
      }
    } catch (error) {
      console.error('[seo-redirect]', error);
    }
  }

  if (pathname === ADMIN_LOGIN_PATH) {
    // Do NOT bounce to /admin based on cookie presence alone. A revoked or
    // deactivated admin still has the cookie; the login page validates the
    // session in the DB and clears a stale cookie. Optimistic redirects here
    // caused a /admin ↔ /admin/login refresh loop.
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const hasAdminSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (hasAdminSession) return NextResponse.next();

    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Do NOT bounce cookie-holders away from /login|/signup. After an admin
  // deactivates a user, DB sessions are deleted but the httpOnly cookie
  // remains; pages then redirect to /login while this gate sent them back to
  // /dashboard — an infinite refresh loop. The login page validates the
  // session server-side and clears a stale cookie when needed.
  // Mid-signup visitors only have VERIFIED_PHONE_COOKIE, not SESSION_COOKIE.
  if (AUTH_PAGES.includes(pathname)) {
    return NextResponse.next();
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
  matcher: [
    '/dashboard/:path*',
    '/checkout/:path*',
    '/wishlist',
    '/admin/:path*',
    '/login',
    '/signup',
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|storage/|icons/|fonts/).*)',
  ],
};
