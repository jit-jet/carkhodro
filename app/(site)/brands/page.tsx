import Link from 'next/link';
import type { Metadata } from 'next';
import { getPartsBrandsCatalog } from '@/actions/brands';
import { buildStaticPageMetadata } from '@/src/lib/static-page-metadata';
import BrandLogo from '@/src/components/ui/BrandLogo';

export function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata('/brands', {
    title: 'برندهای قطعات خودرو | کارخودرو',
    description: 'فهرست برندهای قطعات یدکی موجود در فروشگاه کارخودرو',
  });
}

export default async function BrandsPage() {
  const brands = await getPartsBrandsCatalog();

  return (
    <div className="min-h-screen bg-silver-light" dir="rtl">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="مسیر صفحه">
            <Link href="/" className="transition-colors hover:text-accent">
              خانه
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-charcoal">برندها</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-accent" />
            <h1 className="text-2xl font-black text-charcoal sm:text-3xl">برندهای قطعات خودرو</h1>
          </div>
          <p className="me-4 text-sm text-gray-500">
            برند مورد نظر خود را انتخاب کنید و قطعات آن را ببینید
          </p>
        </div>

        {brands.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${encodeURIComponent(brand.slug)}`}
                className="group flex min-h-48 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg"
              >
                <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-2xl bg-gray-50 shadow-sm sm:h-28 sm:w-28">
                  <BrandLogo
                    src={brand.image}
                    alt={`لوگوی ${brand.name}`}
                    sizes="(max-width: 640px) 96px, 112px"
                    className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <h2 className="text-sm font-bold text-charcoal transition-colors group-hover:text-accent-dark sm:text-base">
                  {brand.name}
                </h2>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-16 text-center shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-charcoal">برندی ثبت نشده است</h2>
            <p className="text-sm text-gray-500">برندهای فعال پس از ثبت در این صفحه نمایش داده می‌شوند.</p>
          </div>
        )}
      </div>
    </div>
  );
}
