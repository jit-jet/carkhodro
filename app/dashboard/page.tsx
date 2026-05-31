/**
 * Dashboard — placeholder page
 * ─────────────────────────────
 * Both successful login (existing user) and successful signup redirect here.
 * Replace the contents of this file with your real dashboard UI.
 */

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'داشبورد | کارخودرو',
};

export default function DashboardPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center text-center">
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

      <h1 className="text-3xl font-extrabold text-charcoal mb-3">خوش آمدید!</h1>
      <p className="text-gray-500 text-base leading-7 mb-10 max-w-md">
        ورود شما با موفقیت انجام شد. این صفحه یک نمونه‌ی موقت است.
        محتوای داشبورد اصلی را اینجا قرار دهید.
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

      {/* Dev note */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4 text-xs leading-6 text-right w-full">
        <strong>یادداشت توسعه‌دهنده:</strong> این صفحه یک placeholder است.
        داده‌های کاربر وارد‌شده در <code className="font-mono bg-amber-100 px-1 rounded">src/data/mockUsers.ts</code> ذخیره می‌شود.
        پس از اتصال به backend واقعی، این صفحه را با اطلاعات واقعی کاربر جایگزین کنید.
      </div>
    </div>
  );
}
