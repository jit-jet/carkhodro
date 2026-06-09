/**
 * Receipt page.
 * ─────────────
 * On-screen transaction detail for a completed order, reached from the "دریافت
 * رسید" button on the payment-success page (`?order=<id>`). Carries a
 * "دانلود PDF" button that prints the receipt to a PDF.
 *
 * The receipt reads the session cookie + database (request-time data), so under
 * Cache Components it streams inside <Suspense> while the static shell ships.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getOrderReceipt } from '@/actions/orders';
import {
  ORDER_STATUS_FA,
  PAYMENT_STATUS_FA,
  PAYMENT_METHOD_FA,
} from '@/src/lib/order-labels';
import DownloadReceiptButton from '@/src/components/payment/DownloadReceiptButton';

export const metadata: Metadata = {
  title: 'رسید سفارش | کارخودرو',
};

interface Props {
  searchParams: Promise<{ order?: string }>;
}

function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان';
}

export default function ReceiptPage({ searchParams }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6" aria-label="breadcrumb">
        <Link href="/" className="hover:text-accent-dark transition-colors">خانه</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-accent-dark transition-colors">داشبورد</Link>
        <span>/</span>
        <span className="text-charcoal font-medium">رسید سفارش</span>
      </nav>

      <Suspense fallback={<ReceiptSkeleton />}>
        <ReceiptContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ReceiptContent({ searchParams }: Props) {
  const { order: orderId } = await searchParams;
  const receipt = orderId ? await getOrderReceipt(orderId) : null;
  if (!receipt) notFound();

  const ref = receipt.id.slice(0, 8).toUpperCase();

  return (
    <>
      {/* Heading + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal">رسید سفارش</h1>
          <p className="text-sm text-gray-400 mt-1">
            شماره سفارش:{' '}
            <span dir="ltr" className="font-mono font-semibold text-charcoal">{ref}</span>
          </p>
        </div>
        <DownloadReceiptButton receipt={receipt} />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Transaction + delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 p-5 border-b border-gray-100 text-sm">
          <Row label="تاریخ ثبت" value={receipt.createdDate} />
          <Row label="نام خریدار" value={receipt.customerName || '—'} />
          <Row label="شماره تماس" value={receipt.phoneNumber} dir="ltr" />
          <Row label="روش پرداخت" value={PAYMENT_METHOD_FA[receipt.paymentMethod]} />
          <Row label="وضعیت پرداخت" value={PAYMENT_STATUS_FA[receipt.paymentStatus]} />
          <Row label="وضعیت سفارش" value={ORDER_STATUS_FA[receipt.status]} />
          <Row
            label="آدرس تحویل"
            value={`${receipt.address.province}، ${receipt.address.city}، ${receipt.address.street}`}
            full
          />
          <Row label="کد پستی" value={receipt.address.postalCode} dir="ltr" />
        </div>

        {/* Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-silver-light text-charcoal text-right">
                <th className="px-4 py-3 font-semibold">محصول</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">تعداد</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">قیمت واحد</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">جمع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {receipt.items.map((it, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-charcoal">{it.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">کد: {it.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-charcoal">{it.quantity.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-charcoal whitespace-nowrap">{formatPrice(it.unitPrice)}</td>
                  <td className="px-4 py-3 font-semibold text-charcoal whitespace-nowrap">{formatPrice(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-5 border-t border-gray-100 flex flex-col items-end gap-2 text-sm">
          <div className="flex justify-between w-full sm:w-72">
            <span className="text-gray-500">جمع کالاها</span>
            <span className="text-charcoal">{formatPrice(receipt.subtotal)}</span>
          </div>
          <div className="flex justify-between w-full sm:w-72">
            <span className="text-gray-500">هزینه ارسال</span>
            <span className="text-charcoal">{formatPrice(receipt.shippingCost)}</span>
          </div>
          {receipt.taxAmount > 0 && (
            <div className="flex justify-between w-full sm:w-72">
              <span className="text-gray-500">مالیات</span>
              <span className="text-charcoal">{formatPrice(receipt.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between w-full sm:w-72 border-t border-gray-200 pt-2 mt-1">
            <span className="font-bold text-charcoal">مبلغ کل</span>
            <span className="font-bold text-accent-dark text-base">{formatPrice(receipt.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/dashboard" className="text-sm font-semibold text-accent-dark hover:underline">
          ← بازگشت به داشبورد
        </Link>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  dir,
  full,
}: {
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
  full?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-gray-500 shrink-0">{label}</span>
      <span dir={dir} className="font-medium text-charcoal text-left">{value}</span>
    </div>
  );
}

function ReceiptSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 bg-gray-100 rounded" />
        <div className="h-11 w-32 bg-gray-100 rounded-xl" />
      </div>
      <div className="h-96 bg-white border border-gray-100 rounded-2xl" />
    </div>
  );
}
