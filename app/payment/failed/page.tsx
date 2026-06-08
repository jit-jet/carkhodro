/**
 * Payment failed page.
 * ────────────────────
 * Landing page when an online payment is cancelled or rejected by the gateway.
 * The gateway callback redirects here, optionally with `?reason=<message>` (and
 * `?order=<id>` for reference). No order is created/charged on failure, so this
 * page only needs to explain what happened and offer a retry.
 *
 * `searchParams` is request-time data under Cache Components, so the part that
 * reads it streams inside <Suspense> while the static shell ships.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'پرداخت ناموفق | کارخودرو',
};

interface Props {
  searchParams: Promise<{ reason?: string; order?: string }>;
}

export default function PaymentFailedPage({ searchParams }: Props) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
      {/* Failure badge */}
      <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal mb-3">
        پرداخت ناموفق بود
      </h1>

      <Suspense fallback={<ReasonFallback />}>
        <FailureReason searchParams={searchParams} />
      </Suspense>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          href="/checkout"
          className="w-full sm:w-auto bg-accent hover:bg-accent-dark text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors shadow hover:shadow-md text-center"
        >
          تلاش مجدد برای پرداخت
        </Link>
        <Link
          href="/cart"
          className="w-full sm:w-auto border-2 border-silver hover:border-accent text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors text-center"
        >
          بازگشت به سبد خرید
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-8 leading-6">
        در صورتی که مبلغی از حساب شما کسر شده، طی ۷۲ ساعت آینده به‌صورت خودکار
        بازگردانده می‌شود. برای پیگیری با{' '}
        <Link href="/contact" className="text-accent-dark font-medium hover:underline">
          پشتیبانی
        </Link>{' '}
        در تماس باشید.
      </p>
    </div>
  );
}

async function FailureReason({ searchParams }: Props) {
  const { reason } = await searchParams;
  return (
    <p className="text-sm text-gray-500 leading-7 mb-8 max-w-md">
      {reason?.trim()
        ? reason
        : 'پرداخت شما تکمیل نشد و سفارشی ثبت نگردید. می‌توانید دوباره تلاش کنید.'}
    </p>
  );
}

function ReasonFallback() {
  return (
    <p className="text-sm text-gray-500 leading-7 mb-8 max-w-md">
      پرداخت شما تکمیل نشد و سفارشی ثبت نگردید. می‌توانید دوباره تلاش کنید.
    </p>
  );
}
