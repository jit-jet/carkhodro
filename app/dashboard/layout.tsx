/**
 * Partner dashboard shell.
 * ────────────────────────
 * Wraps every `/dashboard/*` page with the shared sidebar and a welcome banner
 * carrying the signed-in partner's name. Lives inside the site's root layout, so
 * the storefront header/footer stay in place — this only adds the account-area
 * chrome, rendered in the site's own design system.
 *
 * The banner reads the session cookie (request-time data), so under Cache
 * Components it streams inside a <Suspense> boundary while the static shell — the
 * sidebar and page frame — ships immediately. Access is gated by the proxy
 * (`proxy.ts`); pages re-check at their data source as defense in depth.
 */

import { Suspense } from 'react';
import { getCurrentUser } from '@/src/lib/session';
import { canUseDashboardCart } from '@/src/lib/user-role';
import { USER_ROLE_FA } from '@/src/lib/user-labels';
import DashboardSidebar, { SidebarShell } from '@/src/components/dashboard/DashboardSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-silver-light min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <Suspense fallback={<WelcomeFallback />}>
          <WelcomeBanner />
        </Suspense>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start print:block">
          <Suspense fallback={<SidebarShell activeHref={null} showDashboardCart={false} />}>
            <DashboardSidebarLoader />
          </Suspense>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

async function DashboardSidebarLoader() {
  const user = await getCurrentUser();
  const showDashboardCart = canUseDashboardCart(user?.role ?? null);
  return <DashboardSidebar showDashboardCart={showDashboardCart} />;
}

async function WelcomeBanner() {
  const user = await getCurrentUser();
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const roleLabel = user ? USER_ROLE_FA[user.role] : 'همکار';

  return (
    <header className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs text-gray-400 mb-1">{roleLabel} گرامی</p>
        <h1 className="text-lg sm:text-xl font-extrabold text-charcoal">
          {fullName ? `${fullName} خوش آمدید` : 'به پنل کاربری خوش آمدید'}
        </h1>
      </div>
      <span className="hidden sm:flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-accent-dark shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </span>
    </header>
  );
}

function WelcomeFallback() {
  return (
    <header className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 sm:px-6 sm:py-5 animate-pulse">
      <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
      <div className="h-5 w-56 bg-gray-100 rounded" />
    </header>
  );
}
