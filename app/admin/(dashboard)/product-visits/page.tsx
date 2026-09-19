import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminPagination from '@/src/components/admin/AdminPagination';
import { Badge, Card, EmptyState, Input, PageHeader, Select, TableShell, Td, Th, Toolbar } from '@/src/components/admin/AdminUI';
import { getProductVisitsReport, type ProductVisitFilters, type VisitPurchaseFilter, type VisitRangeFilter, type VisitRoleFilter } from '@/src/lib/admin-product-visits';
import { parsePage, parsePerPage, pickSearchParam } from '@/src/lib/admin-pagination';
import { formatNumberFa } from '@/src/lib/format';

export const metadata: Metadata = { title: 'بازدید محصولات کاربران | پنل مدیریت' };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const dateTime = new Intl.DateTimeFormat('fa-IR', {
  timeZone: 'Asia/Tehran',
  dateStyle: 'medium',
  timeStyle: 'short',
});

function parseRole(value: string): VisitRoleFilter {
  return value === 'RETAIL' || value === 'WHOLESALE' ? value : 'all';
}

function parseRange(value: string): VisitRangeFilter {
  return value === '1' || value === '7' || value === 'all' ? value : '30';
}

function parsePurchase(value: string): VisitPurchaseFilter {
  return value === 'purchased' || value === 'not_purchased' ? value : 'all';
}

export default function ProductVisitsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div className="h-80 rounded-2xl bg-white animate-pulse" />}>
      <ProductVisitsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductVisitsContent({ searchParams }: Props) {
  const sp = await searchParams;
  const filters: ProductVisitFilters = {
    role: parseRole(pickSearchParam(sp.role)),
    range: parseRange(pickSearchParam(sp.range)),
    purchase: parsePurchase(pickSearchParam(sp.purchase)),
    q: pickSearchParam(sp.q).trim().slice(0, 100),
  };
  const perPage = parsePerPage(sp.perPage);
  const data = await getProductVisitsReport(filters, parsePage(sp.page), perPage);

  return (
    <div className="space-y-4">
      <PageHeader
        title="بازدید محصولات کاربران"
        description="هر ردیف یک بازدید از صفحهٔ محصول توسط کاربر واردشده است. بازدید مهمان‌ها ثبت نمی‌شود."
      />

      <Toolbar>
        <form action="/admin/product-visits" method="get" className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(210px,1fr)_150px_150px_170px_auto] xl:items-end">
          <label className="text-xs font-semibold text-gray-600">
            جست‌وجوی کاربر یا محصول
            <Input name="q" defaultValue={filters.q} placeholder="نام، موبایل، نام یا کد محصول" className="mt-1" />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            نوع کاربر
            <Select name="role" defaultValue={filters.role} className="mt-1">
              <option value="all">همه</option>
              <option value="WHOLESALE">همکار</option>
              <option value="RETAIL">مشتری</option>
            </Select>
          </label>
          <label className="text-xs font-semibold text-gray-600">
            زمان بازدید
            <Select name="range" defaultValue={filters.range} className="mt-1">
              <option value="1">۲۴ ساعت اخیر</option>
              <option value="7">۷ روز اخیر</option>
              <option value="30">۳۰ روز اخیر</option>
              <option value="all">همهٔ زمان‌ها</option>
            </Select>
          </label>
          <label className="text-xs font-semibold text-gray-600">
            وضعیت خرید محصول
            <Select name="purchase" defaultValue={filters.purchase} className="mt-1">
              <option value="all">همه</option>
              <option value="purchased">خریداری‌شده</option>
              <option value="not_purchased">بدون خرید نهایی</option>
            </Select>
          </label>
          <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-1">
            <button type="submit" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-charcoal hover:bg-accent-dark">اعمال فیلتر</button>
            <Link href="/admin/product-visits" className="text-sm text-gray-500 hover:text-charcoal">پاک‌کردن</Link>
          </div>
          <input type="hidden" name="perPage" value={perPage} />
        </form>
      </Toolbar>

      <p className="text-xs leading-6 text-gray-500">
        «خریداری‌شده» یعنی برای همین کاربر و محصول، یک سفارش آنلاینِ پرداخت‌شده یا ارسال/تکمیل‌شده وجود دارد؛
        صرف ثبت سفارش خرید نهایی محسوب نمی‌شود. این گزارش رابطهٔ علت و معلولی بین بازدید و خرید را ادعا نمی‌کند.
      </p>

      {data.items.length === 0 ? (
        <Card><EmptyState message="بازدیدی با این فیلترها پیدا نشد." /></Card>
      ) : (
        <TableShell minWidth="min-w-[900px]">
          <thead className="bg-silver-light/70 border-b border-gray-100">
            <tr>
              <Th>کاربر</Th>
              <Th>نوع</Th>
              <Th>محصول بررسی‌شده</Th>
              <Th>زمان بازدید</Th>
              <Th>وضعیت خرید این محصول</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.map((row) => (
              <tr key={row.id} className="hover:bg-silver-light/40">
                <Td>
                  <Link href={`/admin/users/${row.userId}`} className="font-semibold text-charcoal hover:text-accent-dark">
                    {`${row.firstName} ${row.lastName}`.trim() || row.phoneNumber}
                  </Link>
                  {row.shopName && <div className="text-xs text-gray-500">{row.shopName}</div>}
                  <div className="text-xs text-gray-400" dir="ltr">{row.phoneNumber}</div>
                </Td>
                <Td><Badge tone={row.role === 'WHOLESALE' ? 'warning' : 'default'}>{row.role === 'WHOLESALE' ? 'همکار' : 'مشتری'}</Badge></Td>
                <Td>
                  <Link href={`/products/${row.productId}`} className="font-semibold text-charcoal hover:text-accent-dark" target="_blank" rel="noopener noreferrer">
                    {row.productName}
                  </Link>
                  <div className="text-xs text-gray-400" dir="ltr">{row.productSku}</div>
                </Td>
                <Td className="whitespace-nowrap" dir="ltr">{dateTime.format(row.viewedAt)}</Td>
                <Td>
                  {row.purchasedOrderId ? (
                    <div>
                      <Badge tone="success">{row.purchasedAt && row.purchasedAt < row.viewedAt ? 'خرید پیش از این بازدید' : 'خریداری‌شده'}</Badge>
                      <div className="mt-1 text-xs">
                        <Link href={`/admin/orders/${row.purchasedOrderId}`} className="text-blue-700 hover:underline">
                          سفارش {formatNumberFa(row.purchasedOrderNumber ?? 0)}
                        </Link>
                        {row.purchasedAt && <span className="text-gray-400"> · {dateTime.format(row.purchasedAt)}</span>}
                      </div>
                    </div>
                  ) : row.pendingOrderId ? (
                    <div>
                      <Badge tone="warning">سفارش ثبت‌شده، خرید نهایی نشده</Badge>
                      <div className="mt-1 text-xs">
                        <Link href={`/admin/orders/${row.pendingOrderId}`} className="text-blue-700 hover:underline">
                          سفارش {formatNumberFa(row.pendingOrderNumber ?? 0)}
                        </Link>
                      </div>
                    </div>
                  ) : <Badge>بدون خرید</Badge>}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <AdminPagination
        page={data.page}
        pageCount={data.pageCount}
        total={data.total}
        perPage={data.perPage}
        pathname="/admin/product-visits"
        query={{
          ...(filters.q ? { q: filters.q } : {}),
          ...(filters.role !== 'all' ? { role: filters.role } : {}),
          ...(filters.range !== '30' ? { range: filters.range } : {}),
          ...(filters.purchase !== 'all' ? { purchase: filters.purchase } : {}),
        }}
      />
    </div>
  );
}
