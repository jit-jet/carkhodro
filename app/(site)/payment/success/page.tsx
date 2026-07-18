/**
 * Payment success page.
 * ──────────────────────
 * Landing page after a completed payment / placed order. The online-payment
 * gateway (and the checkout flow) redirect here with `?order=<id>`.
 *
 * The order panel reads the session cookie + database (request-time data), so
 * under Cache Components it streams inside <Suspense> while the static shell —
 * the success badge and heading — ships in the prerender.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getOrderConfirmation } from '@/actions/orders';

export const metadata: Metadata = {
  title: 'پرداخت موفق | کارخودرو',
};

interface Props {
  searchParams: Promise<{ order?: string }>;
}

function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان';
}

export default function PaymentSuccessPage({ searchParams }: Props) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
      {/* Success badge */}
      <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal mb-3">
        سفارش با موفقیت ثبت شد.
      </h1>

      <Suspense fallback={<DetailsSkeleton />}>
        <OrderDetails searchParams={searchParams} />
      </Suspense>

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 w-full sm:w-auto">
        <Link
          href="/dashboard/orders"
          className="w-full sm:w-auto bg-accent hover:bg-accent-dark text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors shadow hover:shadow-md text-center"
        >
          مشاهده سفارش‌ها
        </Link>
        <Link
          href="/products"
          className="w-full sm:w-auto border-2 border-silver hover:border-accent text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors text-center"
        >
          ادامه خرید
        </Link>
      </div>
    </div>
  );
}

async function OrderDetails({ searchParams }: Props) {
  const { order: orderId } = await searchParams;
  const order = orderId ? await getOrderConfirmation(orderId) : null;

  if (!order) {
    return (
      <p className="text-sm text-gray-500 leading-7 mb-8 max-w-md">
        سفارش شما ثبت شد. جزئیات سفارش در داشبورد شما در دسترس است. 🎉
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-gray-500 leading-7 mb-6 max-w-md">
        {order.paymentMethod === 'COD'
          ? 'سفارش شما با موفقیت ثبت شد. 🎉'
          : 'پرداخت شما با موفقیت انجام و سفارش ثبت شد. 🎉'}
      </p>

      <dl className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50 mb-8 text-right">
        <div className="flex items-center justify-between px-5 py-3.5">
          <dt className="text-sm text-gray-500">شماره سفارش</dt>
          <dd dir="ltr" className="text-sm font-mono font-semibold text-charcoal">
            {order.id.slice(0, 8).toUpperCase()}
          </dd>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <dt className="text-sm text-gray-500">تعداد اقلام</dt>
          <dd className="text-sm font-semibold text-charcoal">
            {order.itemCount.toLocaleString('fa-IR')} قلم
          </dd>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <dt className="text-sm text-gray-500">روش پرداخت</dt>
          <dd className="text-sm font-semibold text-charcoal">
            {order.paymentMethod === 'COD' ? 'پرداخت در محل' : 'پرداخت آنلاین'}
          </dd>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <dt className="text-sm text-gray-500">مبلغ کل</dt>
          <dd className="text-base font-bold text-accent-dark">
            {formatPrice(order.totalAmount)}
          </dd>
        </div>
      </dl>

      <Link
        href={`/dashboard/orders/${order.id}`}
        className="inline-flex items-center justify-center gap-2 border-2 border-silver hover:border-accent text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors mb-8 w-full sm:w-auto"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        چاپ فاکتور
      </Link>
    </>
  );
}

function DetailsSkeleton() {
  return (
    <div className="w-full animate-pulse mb-8">
      <div className="h-4 w-72 bg-gray-100 rounded mx-auto mb-6" />
      <div className="h-48 w-full bg-gray-100 rounded-2xl" />
    </div>
  );
}
