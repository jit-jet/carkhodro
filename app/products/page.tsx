'use client';

import { useState, useMemo } from 'react';
import FilterSidebar from '@/src/components/plp/FilterSidebar';
import ProductCard from '@/src/components/ui/ProductCard';
import {
  plpProducts,
  PLP_BRANDS,
  PLP_CAR_TYPES,
  PLP_CATEGORIES,
} from '@/src/data/plpMockData';
import type { Product } from '@/src/data/plpMockData';

type SortOption = 'newest' | 'oldest' | 'best_selling' | 'most_viewed' | 'alpha_asc' | 'alpha_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',       label: 'جدیدترین' },
  { value: 'oldest',       label: 'قدیمی‌ترین' },
  { value: 'best_selling', label: 'پرفروش‌ترین' },
  { value: 'most_viewed',  label: 'پربازدید‌ترین' },
  { value: 'alpha_asc',    label: 'الفبا (الف-ی)' },
  { value: 'alpha_desc',   label: 'الفبا (ی-الف)' },
];

function applySorting(products: Product[], sort: SortOption): Product[] {
  const arr = [...products];
  switch (sort) {
    case 'newest':       return arr.sort((a, b) => b.createdDate.localeCompare(a.createdDate));
    case 'oldest':       return arr.sort((a, b) => a.createdDate.localeCompare(b.createdDate));
    case 'best_selling': return arr.sort((a, b) => b.salesCount - a.salesCount);
    case 'most_viewed':  return arr.sort((a, b) => b.viewCount - a.viewCount);
    case 'alpha_asc':    return arr.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    case 'alpha_desc':   return arr.sort((a, b) => b.name.localeCompare(a.name, 'fa'));
  }
}

function openPDFWindow(products: Product[]) {
  const rows = products
    .map(
      (p, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        <td>${i + 1}</td>
        <td>${p.name}</td>
        <td>${p.sku}</td>
        <td>${p.brand}</td>
        <td>${p.carType}</td>
        <td>${p.categoryLabel}</td>
        <td>${p.origin}</td>
        <td>${p.warranty}</td>
        <td>${p.stock > 0 ? p.stock + ' عدد' : 'ناموجود'}</td>
        <td dir="ltr" style="text-align:left">${p.price.toLocaleString()} تومان</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>لیست محصولات - کارخودرو</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#1f2937;padding:24px;font-size:12px}
    .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #F4C232}
    .header h1{font-size:18px;font-weight:bold}
    .meta{font-size:11px;color:#6b7280;text-align:left;line-height:1.6}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#F4C232}
    th,td{padding:7px 9px;text-align:right;border-bottom:1px solid #e5e7eb}
    th{font-weight:bold}
    @media print{body{padding:0}}
  </style>
</head>
<body>
  <div class="header">
    <h1>لیست محصولات - کارخودرو</h1>
    <div class="meta">
      <div>تعداد: ${products.length} محصول</div>
      <div>${new Date().toLocaleDateString('fa-IR')}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>نام محصول</th><th>کد</th><th>برند</th>
        <th>نوع خودرو</th><th>دسته‌بندی</th><th>کشور</th>
        <th>گارانتی</th><th>موجودی</th><th>قیمت</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }
}

function toggleValue(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
}

export default function ProductsPage() {
  const [searchQuery,        setSearchQuery]        = useState('');
  const [selectedBrands,     setSelectedBrands]     = useState<string[]>([]);
  const [selectedCarTypes,   setSelectedCarTypes]   = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy,             setSortBy]             = useState<SortOption>('newest');
  const [sidebarOpen,        setSidebarOpen]        = useState(false);

  const filteredProducts = useMemo(() => {
    let result = plpProducts;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.carType.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      );
    }
    if (selectedBrands.length)     result = result.filter(p => selectedBrands.includes(p.brand));
    if (selectedCarTypes.length)   result = result.filter(p => selectedCarTypes.includes(p.carType));
    if (selectedCategories.length) result = result.filter(p => selectedCategories.includes(p.category));

    return applySorting(result, sortBy);
  }, [searchQuery, selectedBrands, selectedCarTypes, selectedCategories, sortBy]);

  const activeFilterCount =
    selectedBrands.length +
    selectedCarTypes.length +
    selectedCategories.length +
    (searchQuery.trim() ? 1 : 0);

  function clearAll() {
    setSearchQuery('');
    setSelectedBrands([]);
    setSelectedCarTypes([]);
    setSelectedCategories([]);
  }

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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page heading + mobile filter toggle */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-charcoal">لیست محصولات</h1>
          <button
            className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-charcoal hover:border-accent transition-colors"
            onClick={() => setSidebarOpen(o => !o)}
            aria-expanded={sidebarOpen}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6"  x2="20" y2="6" />
              <line x1="4" y1="12" x2="14" y2="12" />
              <line x1="4" y1="18" x2="10" y2="18" />
            </svg>
            فیلترها
            {activeFilterCount > 0 && (
              <span className="bg-accent text-charcoal rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Two-column layout — RTL: col-1 → RIGHT (sidebar), col-2 → LEFT (grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:sticky lg:top-44`}>
            <FilterSidebar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedBrands={selectedBrands}
              onBrandToggle={b    => setSelectedBrands(prev     => toggleValue(prev, b))}
              selectedCarTypes={selectedCarTypes}
              onCarTypeToggle={ct => setSelectedCarTypes(prev   => toggleValue(prev, ct))}
              selectedCategories={selectedCategories}
              onCategoryToggle={c => setSelectedCategories(prev => toggleValue(prev, c))}
              onClearAll={clearAll}
              onExportPDF={() => openPDFWindow(filteredProducts)}
              allBrands={PLP_BRANDS}
              allCarTypes={PLP_CAR_TYPES}
              allCategories={PLP_CATEGORIES}
              activeFilterCount={activeFilterCount}
            />
          </div>

          {/* Main content */}
          <div className="min-w-0">
            {/* Top bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-gray-600">
                تعداد کالاها:{' '}
                <span className="font-bold text-charcoal">
                  {filteredProducts.length.toLocaleString('fa-IR')}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="plp-sort" className="text-sm text-gray-500 whitespace-nowrap">
                  مرتب‌سازی:
                </label>
                <select
                  id="plp-sort"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-charcoal bg-white focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} variant="grid" />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center text-center px-4">
                <span className="text-5xl mb-4 select-none">🔍</span>
                <h3 className="text-lg font-bold text-charcoal mb-2">محصولی یافت نشد</h3>
                <p className="text-sm text-gray-500 mb-5">
                  فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید
                </p>
                <button
                  onClick={clearAll}
                  className="bg-accent hover:bg-accent-dark text-charcoal font-semibold text-sm px-6 py-2 rounded-xl transition-colors"
                >
                  حذف فیلترها
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SEO / category footer text */}
        <section className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
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
