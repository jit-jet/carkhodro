import { Suspense } from 'react';
import Link from 'next/link';
import ProductsBrowser from '@/src/components/plp/ProductsBrowser';
import { getProducts, getProductFilters, withViewerPricing } from '@/actions/products';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const filters = await getProductFilters();

  return (
    <div className="bg-silver-light min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="breadcrumb">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">قطعات خودرو</span>
          </nav>
        </div>
      </div>

      {/* Static shell renders immediately; the URL-driven browser streams in via
          Suspense. The fallback must be static (no `useSearchParams`), so it is a
          skeleton rather than <ProductsBrowser>, which reads request-time data. */}
      <Suspense fallback={<ProductsBrowserSkeleton />}>
        <FilteredBrowser filters={filters} searchParams={searchParams} />
      </Suspense>

    </div>
  );
}

type Filters = {
  brands: { slug: string; name: string }[];
  carBrands: { slug: string; name: string }[];
  carTypes: string[];
  categories: { key: string; label: string }[];
};

async function FilteredBrowser({
  filters,
  searchParams,
}: {
  filters: Filters;
  searchParams: Props['searchParams'];
}) {
  await searchParams;
  const products = await withViewerPricing(await getProducts());
  return (
    <ProductsBrowser
      products={products}
      allBrands={filters.brands}
      allCarBrands={filters.carBrands}
      allCarTypes={filters.carTypes}
      allCategories={filters.categories}
    />
  );
}

/**
 * Static placeholder shown while the URL-driven <ProductsBrowser> streams in.
 * Must not read request-time data (e.g. `useSearchParams`) so it can be part of
 * the prerendered shell under Cache Components.
 */
function ProductsBrowserSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal">لیست محصولات</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        <div className="hidden lg:block h-96 rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse" />
        <div className="min-w-0">
          <div className="h-14 mb-4 rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
