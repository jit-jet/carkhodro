'use client';

/**
 * Interactive part of the signed-in account menu (dashboard link + logout).
 * Rendered only when the server-side <AccountMenu> has already resolved a logged
 * in user, so it never decides auth state itself — it just acts on it. After
 * logout it calls `router.refresh()`, which re-runs the server <AccountMenu> so
 * the navbar flips back to the login button from the same cookie truth.
 */

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/actions/auth';
import { useCartUI } from '@/src/store/cart-ui';

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/** Shared logout side-effect used by both the header button and the hamburger button. */
function useLogoutHandler() {
  const router = useRouter();
  const [loggingOut, startLogout] = useTransition();
  const setCount = useCartUI((s) => s.setCount);

  function handleLogout() {
    startLogout(async () => {
      await logout();
      setCount(0);
      router.push('/');
      router.refresh();
    });
  }

  return { handleLogout, loggingOut };
}

/**
 * Default export — rendered in the header actions row.
 * Shows the account button (icon + name at sm+) always, and an inline logout
 * button only on sm+ (mobile users find logout in the hamburger menu).
 */
export default function AccountMenuClient({ firstName }: { firstName: string }) {
  const { handleLogout, loggingOut } = useLogoutHandler();

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 border-2 border-silver hover:border-accent text-charcoal font-semibold text-sm px-2.5 sm:px-3 py-2.5 rounded-xl transition-colors"
      >
        <UserIcon />
        <span className="hidden sm:inline">{firstName}</span>
      </Link>

      {/* Inline logout — desktop only; mobile users use the hamburger logout button */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="hidden sm:block text-gray-400 hover:text-red-500 transition-colors p-2 disabled:opacity-50"
        aria-label="خروج"
        title="خروج از حساب"
      >
        <LogoutIcon />
      </button>
    </div>
  );
}

/**
 * Named export — placed inside the hamburger panel for mobile users.
 * Rendered by <MobileAccountSection> (AccountMenu.tsx) only when a user is
 * signed in, so this component never needs to check auth state.
 */
export function MobileLogoutButton({ firstName }: { firstName: string }) {
  const { handleLogout, loggingOut } = useLogoutHandler();

  return (
    <div className="border-t border-gray-100">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-5 py-3.5 text-charcoal font-medium text-sm hover:bg-silver-light hover:text-accent-dark border-b border-gray-50 transition-colors"
      >
        <UserIcon />
        <span>{firstName}</span>
      </Link>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-red-500 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
        aria-label="خروج از حساب"
      >
        <LogoutIcon />
        خروج از حساب
      </button>
    </div>
  );
}
