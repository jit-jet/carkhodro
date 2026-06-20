/**
 * Orders list — «سفارشات».
 * Paginated, filterable list of the partner's orders: invoice number, status
 * badge, Jalali date and view / survey actions. Filters (status, per-page,
 * invoice number) are URL-driven, so the content reads request-time search
 * params and streams inside <Suspense>.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPartnerOrders } from '@/actions/partner-orders';
import { ORDER_STATUS_FA, ORDER_STATUS_STYLE } from '@/src/lib/order-labels';
import { formatNumberFa, formatRial } from '@/src/lib/format';
import OrdersFilterBar from '@/src/components/dashboard/OrdersFilterBar';
import type { OrderStatus } from '@/generated/prisma_client';

export const metadata: Metadata = {
  title: 'سفارشات | پنل همکاران اسکار',
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function OrdersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersContent searchParams={searchParams} />
    </Suspense>
  );
}

function pickStatus(value: string | string[] | undefined): OrderStatus | '' {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v in ORDER_STATUS_FA ? (v as OrderStatus) : '';
}

function pickString(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

async function OrdersContent({ searchParams }: Props) {
  const sp = await searchParams;
  const status = pickStatus(sp.status);
  const perPage = Number(pickString(sp.perPage)) || 50;
  const orderNumber = pickString(sp.q);
  const page = Number(pickString(sp.page)) || 1;

  const data = await getPartnerOrders({
    status: status || undefined,
    perPage,
    page,
    orderNumber,
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h1 className="text-lg font-extrabold text-charcoal mb-4 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-accent-dark">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
          </svg>
          لیست سفارشات اسکار
        </h1>
        <OrdersFilterBar status={status} perPage={data.perPage} orderNumber={orderNumber} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
          تعداد {formatNumberFa(data.total)} مورد
        </div>

        {data.items.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-16">سفارشی با این فیلترها یافت نشد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-100">
                  <th className="py-3 px-3 font-medium">#</th>
                  <th className="py-3 px-3 font-medium text-right">شماره فاکتور</th>
                  <th className="py-3 px-3 font-medium">وضعیت</th>
                  <th className="py-3 px-3 font-medium text-right">تاریخ</th>
                  <th className="py-3 px-3 font-medium">مبلغ</th>
                  <th className="py-3 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((order, index) => (
                  <tr key={order.id} className="text-charcoal hover:bg-silver-light/50 transition-colors">
                    <td className="py-3 px-3 text-center text-red-500 font-bold">
                      {formatNumberFa((data.page - 1) * data.perPage + index + 1)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {formatNumberFa(order.orderNumber)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={[
                          'inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap',
                          ORDER_STATUS_STYLE[order.status],
                        ].join(' ')}
                      >
                        {order.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-gray-500 whitespace-nowrap leading-5">
                      {order.dateFull}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold whitespace-nowrap tabular-nums">
                      {formatRial(order.totalToman)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-xs font-bold text-white bg-charcoal hover:bg-charcoal/90 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          مشاهده
                        </Link>
                        <Link
                          href={`/dashboard/orders/${order.id}/survey`}
                          className={[
                            'text-xs font-bold px-3 py-1.5 rounded-lg transition-colors',
                            order.hasSurvey
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-sky-600 bg-sky-50 hover:bg-sky-100',
                          ].join(' ')}
                        >
                          {order.hasSurvey ? 'ویرایش نظر' : 'نظرسنجی'}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.pageCount > 1 && (
          <Pagination
            page={data.page}
            pageCount={data.pageCount}
            status={status}
            perPage={data.perPage}
            orderNumber={orderNumber}
          />
        )}
      </div>
    </div>
  );
}

function pageHref(
  page: number,
  status: OrderStatus | '',
  perPage: number,
  orderNumber: string,
): string {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (perPage !== 50) params.set('perPage', String(perPage));
  if (orderNumber) params.set('q', orderNumber);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/dashboard/orders?${qs}` : '/dashboard/orders';
}

function Pagination({
  page,
  pageCount,
  status,
  perPage,
  orderNumber,
}: {
  page: number;
  pageCount: number;
  status: OrderStatus | '';
  perPage: number;
  orderNumber: string;
}) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap p-4 border-t border-gray-100">
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(p, status, perPage, orderNumber)}
          className={[
            'min-w-9 h-9 px-2 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors',
            p === page
              ? 'bg-accent text-charcoal'
              : 'bg-silver-light text-charcoal hover:bg-gray-200',
          ].join(' ')}
        >
          {p.toLocaleString('fa-IR')}
        </Link>
      ))}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-32 animate-pulse" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-96 animate-pulse" />
    </div>
  );
}
