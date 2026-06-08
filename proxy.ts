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

/** Routes that require a logged-in user. */
const PROTECTED_PREFIXES = ['/dashboard', '/checkout', '/wishlist'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  matcher: ['/dashboard/:path*', '/checkout/:path*', '/wishlist'],
};
