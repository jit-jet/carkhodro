import { Suspense } from 'react';
import { getProductFilters } from '@/actions/products';
import { getProductBrowsePage } from '@/actions/product-browser';
import { productBrowseInputFromParams } from '@/src/lib/product-browse';
import { getCurrentUser } from '@/src/lib/session';
import { cartPathForRole } from '@/src/lib/user-role';
import QuickOrderTable from '@/src/components/quick-order/QuickOrderTable';
import { ADMIN_DEFAULT_PER_PAGE } from '@/src/lib/admin-pagination';

export const metadata = {
  title: 'خرید سریع | کارخودرو',
  description: 'انتخاب و افزودن سریع قطعات خودرو به سبد خرید با نمایش جدولی محصولات',
};

export default function QuickOrderPage() {
  return <div className="min-h-screen bg-silver-light px-4 py-6 sm:py-8" dir="rtl">
    <div className="mx-auto max-w-screen-2xl">
      <h1 className="text-2xl font-extrabold text-charcoal">خرید سریع</h1>
      <p className="mt-2 mb-6 text-sm text-gray-500">قطعه را پیدا کنید، تعداد را وارد کنید و به سبد خرید اضافه کنید.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-gray-100 bg-white" aria-label="در حال دریافت محصولات" />}>
        <Content />
      </Suspense>
    </div>
  </div>;
}

async function Content() {
  const input = productBrowseInputFromParams({});
  // Resolve the request before invoking the browser action's guarded queries.
  const user = await getCurrentUser();
  const [filters, initialPage] = await Promise.all([
    getProductFilters(), getProductBrowsePage(input, ADMIN_DEFAULT_PER_PAGE),
  ]);
  return <QuickOrderTable initialPage={initialPage} filters={filters} cartHref={cartPathForRole(user?.role ?? null)} />;
}
