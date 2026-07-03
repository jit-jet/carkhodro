'use client';

/**
 * Pre-orders / backorders list. Read-only table of the partner's requests with a
 * cancel action for those still pending; cancelling re-reads the list.
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { getBackorders, cancelBackorder } from '@/actions/backorders';
import { formatNumberFa } from '@/src/lib/format';
import type { BackorderVM } from '@/src/lib/dashboard-types';

const STATUS_STYLE: Record<BackorderVM['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
  NOTIFIED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  FULFILLED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function BackordersList({ initial }: { initial: BackorderVM[] }) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  function cancel(id: string) {
    startTransition(async () => {
      await cancelBackorder(id);
      setItems(await getBackorders());
    });
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h1 className="text-lg font-extrabold text-charcoal mb-5">پیش‌خریدها</h1>
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm mb-4">درخواست پیش‌خریدی ثبت نشده است.</p>
          <Link
            href="/products"
            className="inline-block bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            مشاهده محصولات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-extrabold text-charcoal">پیش‌خریدها</h1>
        <p className="text-xs text-gray-400 max-w-xs text-left leading-5">
          درخواست‌های شما در زمان نبود محصول؛ هنگام موجود شدن کالا به شما اطلاع داده می‌شود.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[620px]">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-gray-100">
              <th className="py-3 px-2 font-medium text-right">قطعه</th>
              <th className="py-3 px-2 font-medium text-right">کد</th>
              <th className="py-3 px-2 font-medium">تعداد</th>
              <th className="py-3 px-2 font-medium">وضعیت</th>
              <th className="py-3 px-2 font-medium text-right">تاریخ</th>
              <th className="py-3 px-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((b) => (
              <tr key={b.id} className="text-charcoal">
                <td className="py-3 px-2 text-right font-semibold max-w-[16rem]">
                  <span className="block truncate">{b.productName}</span>
                  {b.inStock && b.status === 'PENDING' && (
                    <span className="text-[11px] text-emerald-600 font-bold">هم‌اکنون موجود است</span>
                  )}
                </td>
                <td className="py-3 px-2 text-right font-mono text-xs text-gray-500">{b.sku}</td>
                <td className="py-3 px-2 text-center">{formatNumberFa(b.quantity)}</td>
                <td className="py-3 px-2 text-center">
                  <span className={['inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border', STATUS_STYLE[b.status]].join(' ')}>
                    {b.statusLabel}
                  </span>
                </td>
                <td className="py-3 px-2 text-right text-xs text-gray-500">{b.date}</td>
                <td className="py-3 px-2 text-center">
                  {b.status === 'PENDING' && (
                    <button
                      onClick={() => cancel(b.id)}
                      disabled={pending}
                      className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      لغو
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
