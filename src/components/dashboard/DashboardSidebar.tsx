'use client';

/**
 * Partner dashboard sidebar.
 * ──────────────────────────
 * The shared left-hand (RTL: right-hand) navigation for every dashboard page —
 * active link via `usePathname`, a logout action (mirrors the header's logout),
 * and the two quick-access call-to-action buttons from the reference design.
 * Styled with the site's own design tokens (accent gold + charcoal), not the
 * screenshot's raw look.
 *
 * Note: there is no «تغییر رمز» (change password) item — this site authenticates
 * with one-time SMS codes, so there is no password to change; «آمار» (stats) is
 * folded into the dashboard home rather than a separate page.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { logout } from '@/actions/auth';
import { refreshClientUI } from '@/src/store/refresh-client-ui';

type IconKey =
  | 'grid'
  | 'support'
  | 'cart'
  | 'orders'
  | 'pricelist'
  | 'suggest'
  | 'heart'
  | 'user';

interface NavItem {
  href: string;
  label: string;
  icon: IconKey;
  /** When true, only shown to wholesale partners. */
  wholesaleOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'داشبورد', icon: 'grid' },
  { href: '/dashboard/support', label: 'پشتیبانی', icon: 'support' },
  { href: '/dashboard/cart', label: 'سبد خرید', icon: 'cart', wholesaleOnly: true },
  { href: '/dashboard/orders', label: 'سفارشات', icon: 'orders' },
  { href: '/dashboard/price-list', label: 'دریافت لیست قیمت', icon: 'pricelist' },
  {
    href: '/dashboard/suggest-product',
    label: 'پیشنهاد محصول',
    icon: 'suggest',
    wholesaleOnly: true,
  },
  { href: '/dashboard/favorites', label: 'علاقه‌مندی‌ها', icon: 'heart' },
  { href: '/dashboard/profile', label: 'پروفایل من', icon: 'user' },
];

function NavIcon({ icon }: { icon: IconKey }) {
  const cls = 'w-5 h-5 shrink-0';
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: cls,
  };
  switch (icon) {
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'support':
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case 'cart':
      return (
        <svg {...common}>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
        </svg>
      );
    case 'orders':
      return (
        <svg {...common}>
          <path d="M16.5 9.4 7.5 4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05" />
          <path d="M12 22.08V12" />
        </svg>
      );
    case 'pricelist':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
    case 'suggest':
      return (
        <svg {...common}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
  }
}

/**
 * Presentational + interactive sidebar. `activeHref` is the current pathname (or
 * null before it has streamed in). Kept free of `usePathname` so it can render in
 * the static shell as the Suspense fallback; the active version streams in.
 */
export function SidebarShell({
  activeHref,
  showWholesaleNav = true,
}: {
  activeHref: string | null;
  /** Wholesale-only items (cart, product suggestions) — hidden for retail. */
  showWholesaleNav?: boolean;
}) {
  const router = useRouter();
  const [loggingOut, startLogout] = useTransition();

  const navItems = showWholesaleNav
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => !item.wholesaleOnly);

  function isActive(href: string): boolean {
    if (activeHref === null) return false;
    if (href === '/dashboard') return activeHref === '/dashboard';
    return activeHref === href || activeHref.startsWith(`${href}/`);
  }

  function handleLogout() {
    startLogout(async () => {
      await logout();
      await refreshClientUI();
      router.push('/');
      router.refresh();
    });
  }

  return (
    <aside className="lg:sticky lg:top-24">
      <nav
        aria-label="منوی داشبورد"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <ul className="p-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                    active
                      ? 'bg-amber-50 text-accent-dark'
                      : 'text-charcoal hover:bg-silver-light',
                  ].join(' ')}
                >
                  <span className={active ? 'text-accent-dark' : 'text-gray-400'}>
                    <NavIcon icon={item.icon} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {active && <span className="w-1.5 h-6 rounded-full bg-accent" />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-gray-100 p-2">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 shrink-0"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {loggingOut ? 'در حال خروج…' : 'خروج'}
          </button>
        </div>
      </nav>

      {/* Quick-access call-to-action buttons (from the reference design). */}
      <div className="mt-4 space-y-3">
        <Link
          href="/products"
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm py-3.5 rounded-2xl transition-colors shadow-sm"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4.5 h-4.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          قطعات خودرو
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 bg-charcoal hover:bg-charcoal/90 text-white font-bold text-sm py-3.5 rounded-2xl transition-colors shadow-sm"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4.5 h-4.5"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          صفحه اصلی
        </Link>
      </div>
    </aside>
  );
}

/**
 * Reads the request-time pathname for active-link highlighting. `usePathname` is
 * dynamic under Cache Components, so the layout renders this inside a <Suspense>
 * boundary whose fallback is <SidebarShell activeHref={null}> (no active state).
 */
export default function DashboardSidebar({
  showWholesaleNav = true,
}: {
  showWholesaleNav?: boolean;
}) {
  const pathname = usePathname();
  return <SidebarShell activeHref={pathname} showWholesaleNav={showWholesaleNav} />;
}
