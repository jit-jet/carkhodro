/**
 * Dashboard home — «داشبورد».
 * ────────────────────────────
 * Live stat cards pulled from the signed-in partner's data: ledger balance,
 * completed / in-progress orders, cart size, backorders, favorites, recent
 * orders, last invoice, profile (avatar state) and a back-to-site card. Each
 * card links to the matching page. The cards read the session cookie, so they
 * stream inside <Suspense> while the static shell ships.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getDashboardStats } from '@/actions/dashboard';
import { formatRial, formatNumberFa } from '@/src/lib/format';
import Avatar from '@/src/components/dashboard/Avatar';
import type { DashboardStatsVM } from '@/src/lib/dashboard-types';

export const metadata: Metadata = {
  title: 'داشبورد | پنل همکاران کارخودرو',
};

export default function DashboardHomePage() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsGrid />
    </Suspense>
  );
}

async function StatsGrid() {
  const stats = await getDashboardStats();
  if (!stats) redirect('/login?redirect=/dashboard');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <StatCard
        href="/dashboard/orders"
        icon="wallet"
        title="مانده حساب"
        value={formatRial(stats.accountBalanceToman)}
        subtitle="مانده حساب از قبل"
        tone="accent"
      />
      <StatCard
        href="/dashboard/orders?status=COMPLETED"
        icon="check"
        title="سفارش تکمیل شده"
        value={`${formatNumberFa(stats.completedOrders)} عدد`}
        subtitle="سفارشات تکمیل شده"
      />
      <StatCard
        href="/dashboard/orders"
        icon="progress"
        title="سفارش در حال انجام"
        value={stats.inProgressOrders > 0 ? `${formatNumberFa(stats.inProgressOrders)} عدد` : 'خالی'}
        subtitle="سفارشات در حال پردازش"
      />
      <StatCard
        href="/dashboard/cart"
        icon="cart"
        title="سبد خرید"
        value={`${formatNumberFa(stats.cartItemCount)} قلم`}
        subtitle="مشاهده و تکمیل فاکتور"
      />
      <StatCard
        href="/dashboard/backorders"
        icon="clock"
        title="پیش‌خریدها"
        value={`${formatNumberFa(stats.backorderCount)} درخواست`}
        subtitle="درخواست‌های شما در زمان نبود محصول"
      />
      <StatCard
        href="/dashboard/favorites"
        icon="heart"
        title="علاقه‌مندی‌ها"
        value={`${formatNumberFa(stats.favoritesCount)} مورد`}
        subtitle="محصولات نشان‌شده"
      />
      <StatCard
        href="/dashboard/orders"
        icon="orders"
        title="سفارشات اخیر"
        value={`${formatNumberFa(stats.totalOrders)} سفارش`}
        subtitle="لیست همه سفارشات ثبت‌شده"
      />
      <LastInvoiceCard lastInvoice={stats.lastInvoice} />
      <ProfileCard stats={stats} />
      <StatCard
        href="/"
        icon="back"
        title="سایت"
        value="بازگشت به سایت"
        subtitle="رفتن به فروشگاه اصلی"
      />
    </div>
  );
}

function LastInvoiceCard({ lastInvoice }: { lastInvoice: DashboardStatsVM['lastInvoice'] }) {
  if (!lastInvoice) {
    return (
      <StatCard
        href="/dashboard/cart"
        icon="invoice"
        title="آخرین فاکتور"
        value="—"
        subtitle="هنوز فاکتوری ثبت نشده"
      />
    );
  }
  return (
    <StatCard
      href={`/dashboard/orders/${lastInvoice.id}`}
      icon="invoice"
      title="آخرین فاکتور"
      value={`#${formatNumberFa(lastInvoice.orderNumber)}`}
      subtitle={`ثبت‌شده در ${lastInvoice.date}`}
    />
  );
}

function ProfileCard({ stats }: { stats: DashboardStatsVM }) {
  return (
    <Link
      href="/dashboard/profile"
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:border-accent hover:shadow-md transition-all"
    >
      <Avatar src={stats.profileImage} size={56} alt={stats.fullName} />
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">پروفایل من</p>
        <p className="text-base font-extrabold text-charcoal truncate">
          {stats.hasAvatar ? 'دارای عکس پروفایل' : 'فاقد عکس'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">ویرایش مشخصات کاربری</p>
      </div>
    </Link>
  );
}

// ── Card primitives ───────────────────────────────────────────────────────────

type CardIcon =
  | 'wallet'
  | 'check'
  | 'progress'
  | 'cart'
  | 'clock'
  | 'heart'
  | 'orders'
  | 'invoice'
  | 'back';

function StatCard({
  href,
  icon,
  title,
  value,
  subtitle,
  tone = 'default',
}: {
  href: string;
  icon: CardIcon;
  title: string;
  value: string;
  subtitle: string;
  tone?: 'default' | 'accent';
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-3 hover:border-accent hover:shadow-md transition-all"
    >
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-1">{title}</p>
        <p
          className={[
            'text-xl font-extrabold truncate',
            tone === 'accent' ? 'text-accent-dark' : 'text-charcoal',
          ].join(' ')}
        >
          {value}
        </p>
        <p className="text-xs text-gray-400 mt-1.5 leading-5">{subtitle}</p>
      </div>
      <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-silver-light text-gray-400 group-hover:bg-amber-50 group-hover:text-accent-dark transition-colors shrink-0">
        <CardIconSvg icon={icon} />
      </span>
    </Link>
  );
}

function CardIconSvg({ icon }: { icon: CardIcon }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'w-5 h-5',
  };
  switch (icon) {
    case 'wallet':
      return (
        <svg {...common}>
          <path d="M21 12V7H5a2 2 0 010-4h14v4" />
          <path d="M3 5v14a2 2 0 002 2h16v-5" />
          <path d="M18 12a2 2 0 000 4h4v-4z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'progress':
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 11-6.219-8.56" />
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
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
        </svg>
      );
    case 'orders':
      return (
        <svg {...common}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05" />
          <path d="M12 22.08V12" />
        </svg>
      );
    case 'invoice':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'back':
      return (
        <svg {...common}>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      );
  }
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
      ))}
    </div>
  );
}
