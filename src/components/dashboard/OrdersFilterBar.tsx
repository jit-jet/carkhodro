'use client';

/**
 * Orders list filter bar — status dropdown, per-page count and invoice-number
 * search. Each control rewrites the URL query (resetting to page 1); the server
 * page re-reads the params and refetches. Mirrors the storefront's URL-driven
 * filtering so deep links and the back button just work.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ORDER_STATUS_FA, ORDER_STATUS_ORDER } from '@/src/lib/order-labels';
import { PER_PAGE_OPTIONS } from '@/src/lib/dashboard-options';
import type { OrderStatus } from '@/generated/prisma_client';

interface Props {
  status: OrderStatus | '';
  perPage: number;
  orderNumber: string;
}

export default function OrdersFilterBar({ status, perPage, orderNumber }: Props) {
  const router = useRouter();
  const [number, setNumber] = useState(orderNumber);

  function pushQuery(patch: Record<string, string>) {
    const params = new URLSearchParams();
    const next = { status, perPage: String(perPage), q: number, ...patch };
    if (next.status) params.set('status', String(next.status));
    if (next.perPage && Number(next.perPage) !== 50) params.set('perPage', String(next.perPage));
    if (next.q) params.set('q', String(next.q));
    // Any filter change resets to the first page.
    const qs = params.toString();
    router.push(qs ? `/dashboard/orders?${qs}` : '/dashboard/orders');
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">وضعیت</label>
        <select
          value={status}
          onChange={(e) => pushQuery({ status: e.target.value })}
          className="w-full border-2 border-silver focus:border-accent rounded-xl px-3 py-2.5 text-sm outline-none transition-colors bg-white"
        >
          <option value="">همه وضعیت‌ها</option>
          {ORDER_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_FA[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">تعداد در صفحه</label>
        <select
          value={perPage}
          onChange={(e) => pushQuery({ perPage: e.target.value })}
          className="w-full border-2 border-silver focus:border-accent rounded-xl px-3 py-2.5 text-sm outline-none transition-colors bg-white"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n.toLocaleString('fa-IR')}
            </option>
          ))}
        </select>
      </div>

      <div className="lg:col-span-2">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">شماره فاکتور</label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            pushQuery({ q: number });
          }}
          className="flex gap-2"
        >
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            dir="ltr"
            placeholder="کد پیگیری (شماره فاکتور)"
            className="flex-1 border-2 border-silver focus:border-accent rounded-xl px-3 py-2.5 text-sm outline-none transition-colors text-right"
          />
          <button
            type="submit"
            className="bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shrink-0"
          >
            جستجو
          </button>
        </form>
      </div>
    </div>
  );
}
