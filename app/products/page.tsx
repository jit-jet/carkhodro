import { Suspense } from 'react';
import ProductsBrowser from '@/src/components/plp/ProductsBrowser';
import { getProducts, getProductFilters } from '@/actions/products';

interface Props {
  searchParams: Promise<{ brand?: string; category?: string; car?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const [products, filters] = await Promise.all([
    getProducts(),
    getProductFilters(),
  ]);

  return (
    <div className="bg-silver-light min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="breadcrumb">
            <a href="/" className="hover:text-accent transition-colors">خانه</a>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">قطعات خودرو</span>
          </nav>
        </div>
      </div>

      {/* Static shell renders immediately; filter params stream in via Suspense */}
      <Suspense fallback={
        <ProductsBrowser
          products={products}
          allBrands={filters.brands}
          allCarTypes={filters.carTypes}
          allCategories={filters.categories}
        />
      }>
        <FilteredBrowser products={products} filters={filters} searchParams={searchParams} />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 pb-6">
        <section className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
          <h2 className="text-xl font-bold text-charcoal mb-5">راهنمای خرید قطعات یدکی خودرو</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 leading-7">
            <div>
              <h3 className="text-base font-semibold text-charcoal mb-2">چرا کارخودرو؟</h3>
              <p>
                فروشگاه آنلاین کارخودرو با بیش از ۵۰,۰۰۰ قطعه یدکی اصل، معتبرترین مرجع خرید قطعات
                خودروهای ایرانی و خارجی است. تمامی محصولات دارای ضمانت اصالت کالا بوده و از برندهای
                معتبر جهانی مانند بوش، NGK، ایساکو و واریان تأمین می‌شوند.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-charcoal mb-2">راهنمای انتخاب قطعه مناسب</h3>
              <p>
                برای انتخاب صحیح قطعه، مدل، سال ساخت و شماره موتور خودرو خود را مشخص کنید. در صورت
                نیاز به راهنمایی، کارشناسان فنی ما از طریق چت آنلاین یا تماس تلفنی در کنار شما هستند.
                ارسال سریع به سراسر ایران در کمتر از ۴۸ ساعت.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-charcoal mb-2">گارانتی و ضمانت بازگشت</h3>
              <p>
                تمامی محصولات کارخودرو دارای ضمانت اصالت و ۷ روز ضمانت بازگشت وجه هستند. در صورت وجود
                هرگونه مشکل، تیم پشتیبانی ما ۲۴ ساعته آماده رسیدگی به درخواست‌های شما است.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-charcoal mb-2">پرکاربردترین قطعات</h3>
              <p>
                فیلتر روغن، لنت ترمز، فیلتر هوا، واتر پمپ و شمع از پرفروش‌ترین قطعات یدکی در
                کارخودرو هستند. این قطعات برای تمامی مدل‌های پراید، پژو ۲۰۶، پژو ۴۰۵، سمند، دنا،
                تیبا و ساینا موجود می‌باشند.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

type Filters = { brands: string[]; carTypes: string[]; categories: { key: string; label: string }[] };

async function FilteredBrowser({
  products,
  filters,
  searchParams,
}: {
  products: Parameters<typeof ProductsBrowser>[0]['products'];
  filters: Filters;
  searchParams: Props['searchParams'];
}) {
  const { brand = '', category = '', car = '' } = await searchParams;
  return (
    <ProductsBrowser
      products={products}
      allBrands={filters.brands}
      allCarTypes={filters.carTypes}
      allCategories={filters.categories}
      initialBrand={brand}
      initialCategory={category}
      initialCar={car}
    />
  );
}
