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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function AccountMenuClient({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [loggingOut, startLogout] = useTransition();
  const setCount = useCartUI((s) => s.setCount);

  function handleLogout() {
    startLogout(async () => {
      await logout();
      setCount(0);
      router.push('/');
      // Re-run the server <AccountMenu>: the cookie is gone, so it now renders
      // the login button. Keeps the navbar in sync with the real session.
      router.refresh();
    });
  }

  return (
    <div className="hidden sm:flex items-center gap-2">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 border-2 border-silver hover:border-accent text-charcoal font-semibold text-sm px-3 py-2.5 rounded-xl transition-colors"
      >
        <UserIcon />
        <span className="hidden md:inline">{firstName}</span>
      </Link>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="text-gray-400 hover:text-red-500 transition-colors p-2 disabled:opacity-50"
        aria-label="خروج"
        title="خروج از حساب"
      >
        <LogoutIcon />
      </button>
    </div>
  );
}
