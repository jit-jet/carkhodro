/**
 * Dashboard — placeholder page
 * ─────────────────────────────
 * Both successful login (existing user) and successful signup redirect here.
 * Replace the contents of this file with your real dashboard UI.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/src/lib/session';
import { getUserOrders } from '@/actions/orders';

export const metadata: Metadata = {
  title: 'داشبورد | کارخودرو',
};

function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان';
}

const ORDER_STATUS_FA: Record<string, string> = {
  PENDING: 'در انتظار پرداخت',
  CONFIRMED: 'تأیید شده',
  PROCESSING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو شده',
  REFUNDED: 'مرجوع شده',
};

// The account view depends on the session cookie → request-time (dynamic) data.
// Under Cache Components that must stream inside a <Suspense> boundary, so the
// page ships a static shell and the user-specific panel streams in.
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

// The `proxy` redirects signed-out visitors before they get here, but we
// re-check at the data source (defense in depth) and read the real
// authenticated user — no more mock store.
async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/dashboard');

  const orders = await getUserOrders();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center text-center">
      {/* Success badge */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-green-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 className="text-3xl font-extrabold text-charcoal mb-3">
        خوش آمدید، {user.firstName} {user.lastName}!
      </h1>
      <p className="text-gray-500 text-base leading-7 mb-10 max-w-md">
        شما با شماره{' '}
        <span dir="ltr" className="font-mono font-semibold text-charcoal">
          {user.phoneNumber}
        </span>{' '}
        وارد شده‌اید.
      </p>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-10">
        {[
          { href: '/products', label: 'مشاهده محصولات', icon: '🛒' },
          { href: '/cart',     label: 'سبد خرید',        icon: '🛍️' },
          { href: '/',         label: 'صفحه اصلی',        icon: '🏠' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border-2 border-silver-light hover:border-accent rounded-2xl px-4 py-5 flex flex-col items-center gap-2 text-sm font-semibold text-charcoal transition-all hover:shadow-md"
          >
            <span className="text-2xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Order history */}
      <section className="w-full text-right">
        <h2 className="text-lg font-bold text-charcoal mb-4">سفارش‌های من</h2>
        {orders.length === 0 ? (
          <div className="bg-silver-light rounded-2xl px-5 py-8 text-center text-sm text-gray-500">
            هنوز سفارشی ثبت نکرده‌اید.
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li
                key={o.id}
                className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-charcoal">
                    {o.itemCount.toLocaleString('fa-IR')} قلم کالا
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{o.createdDate}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-accent-dark">
                    {formatPrice(o.totalAmount)}
                  </p>
                  <span className="text-xs text-gray-500">
                    {ORDER_STATUS_FA[o.status] ?? o.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center animate-pulse">
      <div className="w-20 h-20 rounded-full bg-gray-100 mb-6" />
      <div className="h-8 w-64 bg-gray-100 rounded mb-3" />
      <div className="h-4 w-80 bg-gray-100 rounded mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-10">
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-40 w-full bg-gray-100 rounded-2xl" />
    </div>
  );
}
