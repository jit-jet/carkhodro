/**
 * Invoice detail — «فاکتور».
 * The full printable sales invoice for one order: buyer + address, invoice
 * number/date/time/status, line table (row, SKU, name, price, qty, discount,
 * total), totals (sum, discount, payable + payable-in-words), previous balance,
 * notes and a print button. Scoped to the owner; streams inside <Suspense>.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getInvoice } from '@/actions/dashboard-orders';
import { ORDER_STATUS_STYLE } from '@/src/lib/order-labels';
import { formatRial, formatNumberFa, tomanInWords } from '@/src/lib/format';
import PrintButton from '@/src/components/dashboard/PrintButton';

export const metadata: Metadata = {
  title: 'فاکتور | پنل کاربری کارخودرو',
};

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <InvoiceContent params={params} />
    </Suspense>
  );
}

async function InvoiceContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/dashboard/orders"
          className="flex items-center gap-1.5 text-sm font-semibold text-charcoal hover:text-accent-dark transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          بازگشت به سفارشات
        </Link>
        <Link
          href={`/dashboard/orders/${invoice.id}/survey`}
          className="text-sm font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors"
        >
          {invoice.hasSurvey ? 'ویرایش نظرسنجی' : 'ثبت نظرسنجی'}
        </Link>
      </div>

      {/* Invoice */}
      <div className="print-area bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
        {/* Header */}
        <div className="grid sm:grid-cols-3 gap-4 items-start pb-6 border-b border-gray-100">
          <div className="order-2 sm:order-1 text-xs space-y-1 text-charcoal">
            <p>
               فاکتورشماره: <span className="font-mono font-bold">{invoice.orderNumber}</span>
            </p>
            <p>تاریخ: {invoice.date}</p>
            <p>زمان: {invoice.time}</p>
            <p className="flex items-center gap-1">
              وضعیت:
              <span className={['inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border', ORDER_STATUS_STYLE[invoice.status]].join(' ')}>
                {invoice.statusLabel}
              </span>
            </p>
          </div>
          <div className="order-1 sm:order-2 flex flex-col items-center">
            <Image src="/logo.png" alt="کارخودرو" width={120} height={40} className="object-contain" />
            <p className="text-sm font-bold text-charcoal mt-2">فاکتور فروش</p>
          </div>
          <div className="order-3 text-xs space-y-1 text-charcoal sm:text-left">
            <p className="font-bold text-sm mb-1">خریدار: {invoice.buyerName}</p>
            <p className="text-gray-500 leading-5">
              {invoice.address.province} - {invoice.address.city} - {invoice.address.street}
            </p>
            <p className="text-gray-500">کد پستی: {invoice.address.postalCode || '—'}</p>
            <p dir="ltr" className="text-gray-500 text-right sm:text-left">
              {invoice.phoneNumber}
            </p>
          </div>
        </div>

        {/* Lines */}
        <div className="overflow-x-auto mt-5">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-silver-light text-charcoal text-xs">
                <th className="py-2.5 px-2 font-semibold">ردیف</th>
                <th className="py-2.5 px-2 font-semibold text-right">شناسه کالا</th>
                <th className="py-2.5 px-2 font-semibold text-right">نام کالا</th>
                <th className="py-2.5 px-2 font-semibold">قیمت (ریال)</th>
                <th className="py-2.5 px-2 font-semibold">تعداد</th>
                <th className="py-2.5 px-2 font-semibold">تخفیف</th>
                <th className="py-2.5 px-2 font-semibold">کل (ریال)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.lines.map((line) => (
                <tr key={line.rowNo} className="text-charcoal">
                  <td className="py-2.5 px-2 text-center text-gray-400">{formatNumberFa(line.rowNo)}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-xs text-gray-500">{line.sku}</td>
                  <td className="py-2.5 px-2 text-right font-semibold">{line.name}</td>
                  <td className="py-2.5 px-2 text-center tabular-nums whitespace-nowrap">
                    {formatNumberFa(line.unitPriceToman * 10)}
                  </td>
                  <td className="py-2.5 px-2 text-center">{formatNumberFa(line.quantity)}</td>
                  <td className="py-2.5 px-2 text-center text-gray-500">٪{line.discountPct.toLocaleString('fa-IR')}</td>
                  <td className="py-2.5 px-2 text-center font-bold tabular-nums whitespace-nowrap">
                    {formatNumberFa(line.lineNetToman * 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex flex-col items-end gap-1.5 text-sm">
          <Row label="جمع تعداد" value={`${formatNumberFa(invoice.totalItems)} عدد`} />
          <Row label="جمع کل" value={formatRial(invoice.subtotalToman)} />
          <Row label="تخفیف" value={formatRial(invoice.discountToman)} />
          <div className="w-full sm:w-96 bg-charcoal text-white rounded-xl px-4 py-3 flex items-center justify-between mt-1">
            <span className="font-semibold">قابل پرداخت</span>
            <span className="font-extrabold tabular-nums">{formatRial(invoice.payableToman)}</span>
          </div>
          <p className="w-full sm:w-96 text-xs text-accent-dark font-semibold text-left mt-1">
            {tomanInWords(invoice.payableToman)}
          </p>
        </div>

        {/* Previous balance + notes */}
        <div className="mt-6 pt-5 border-t border-gray-100 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">مانده از قبل</p>
            <p className="font-semibold tabular-nums">{formatRial(invoice.previousBalanceToman)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">توضیحات</p>
            <p className="font-medium text-charcoal leading-6">
              {invoice.notes ?? '_'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <PrintButton />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-full sm:w-96 flex items-center justify-between text-charcoal">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function InvoiceSkeleton() {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[32rem] animate-pulse" />;
}
