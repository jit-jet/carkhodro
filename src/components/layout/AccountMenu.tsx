/**
 * Navbar account slot — the single source of truth for the header's auth state.
 * ─────────────────────────────────────────────────────────────────────────────
 * A Server Component that reads the session cookie via `getCurrentUser()` — the
 * SAME function the `proxy` and the checkout/dashboard pages use — so the navbar
 * can never disagree with access control. It reads cookies, so it's request-time
 * (dynamic) data and is rendered inside a <Suspense> boundary in the layout; the
 * rest of the header stays a static shell.
 *
 * It re-runs on every navigation and on `router.refresh()` (called after login
 * and logout), which is what keeps the navbar in sync — replacing the old, buggy
 * one-time client-side snapshot in <Header>.
 */

import Link from 'next/link';
import { getCurrentUser } from '@/src/lib/session';
import AccountMenuClient, { MobileLogoutButton } from './AccountMenuClient';

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/**
 * Header account slot — always visible on all viewports.
 * Guests → icon-only login button on mobile, icon + text on sm+.
 * Signed-in → account button + inline logout (logout on desktop, hamburger on mobile).
 */
export default async function AccountMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 border-2 border-silver hover:border-accent text-charcoal font-semibold text-sm px-2.5 sm:px-3 py-2.5 rounded-xl transition-colors"
      >
        <UserIcon />
        <span className="hidden sm:inline">ورود / ثبت‌نام</span>
      </Link>
    );
  }

  return <AccountMenuClient firstName={user.firstName} />;
}

/**
 * Hamburger-panel account section — server component, placed in the mobile
 * menu overlay via the `mobileMenuAccount` slot in <Header>.
 * Renders the user's name + a logout button when signed in; nothing for guests
 * (guests see the login link in the main header, not in the hamburger).
 */
export async function MobileAccountSection() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <MobileLogoutButton firstName={user.firstName} />;
}

/** Layout-shift-free placeholder while the session resolves (streamed in). */
export function AccountMenuFallback() {
  return (
    <div className="w-10 sm:w-28 h-10 rounded-xl bg-silver-light animate-pulse" />
  );
}
