/**
 * Generated price list — printable result of a saved request.
 * Resolves the snapshotted filter to a concrete parts + price table the partner
 * prints / saves as PDF. Shows a validity note and an expiry banner after ~24h.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPriceListRequest } from '@/actions/price-list';
import { formatRial, formatNumberFa } from '@/src/lib/format';
import PrintButton from '@/src/components/dashboard/PrintButton';

export const metadata: Metadata = {
  title: 'لیست قیمت | پنل همکاران کارخودرو',
};

export default function GeneratedPriceListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ListContent params={params} />
    </Suspense>
  );
}

async function ListContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await getPriceListRequest(id);
  if (!list) notFound();

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/dashboard/price-list"
          className="flex items-center gap-1.5 text-sm font-semibold text-charcoal hover:text-accent-dark transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          ساخت لیست جدید
        </Link>
        {!list.isExpired && <PrintButton label="دانلود / چاپ PDF" />}
      </div>

      {list.isExpired && (
        <div className="no-print bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
          اعتبار این لیست قیمت به پایان رسیده است. لطفاً برای دریافت قیمت‌های به‌روز، لیست جدیدی بسازید.
        </div>
      )}

      <div className="print-area bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-gray-100 flex-wrap">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="کارخودرو" width={110} height={36} className="object-contain" />
            <div>
              <p className="text-sm font-bold text-charcoal">لیست قیمت قطعات کارخودرو</p>
              <p className="text-xs text-gray-400 mt-0.5">تاریخ صدور: {list.createdAt}</p>
            </div>
          </div>
          <div className="text-xs text-gray-400 text-left">
            <p>اعتبار تا: {list.expiresAt}</p>
            <p>تعداد اقلام: {formatNumberFa(list.items.length)}</p>
          </div>
        </div>

        {list.items.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-16">
            موردی مطابق با فیلترهای انتخابی یافت نشد.
          </p>
        ) : (
          <div className="overflow-x-auto mt-5">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-silver-light text-charcoal text-xs">
                  <th className="py-2.5 px-2 font-semibold">ردیف</th>
                  <th className="py-2.5 px-2 font-semibold text-right">کد</th>
                  <th className="py-2.5 px-2 font-semibold text-right">نام قطعه</th>
                  <th className="py-2.5 px-2 font-semibold text-right">برند</th>
                  <th className="py-2.5 px-2 font-semibold text-right">خودرو</th>
                  <th className="py-2.5 px-2 font-semibold">قیمت (ریال)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.items.map((item, index) => (
                  <tr key={item.sku} className="text-charcoal">
                    <td className="py-2.5 px-2 text-center text-gray-400">{formatNumberFa(index + 1)}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-xs text-gray-500">{item.sku}</td>
                    <td className="py-2.5 px-2 text-right font-semibold">{item.name}</td>
                    <td className="py-2.5 px-2 text-right text-gray-500">{item.brand}</td>
                    <td className="py-2.5 px-2 text-right text-gray-500">{item.carType || '—'}</td>
                    <td className="py-2.5 px-2 text-center font-bold tabular-nums whitespace-nowrap">
                      {formatRial(item.priceToman)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ListSkeleton() {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[32rem] animate-pulse" />;
}
