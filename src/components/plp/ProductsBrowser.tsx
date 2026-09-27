'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import FilterSidebar from '@/src/components/plp/FilterSidebar';
import ProductCard from '@/src/components/ui/ProductCard';
import { getProductBrowsePage, getProductsForExport } from '@/actions/product-browser';
import type { ProductVM as Product } from '@/src/lib/serializers';
import type {
  ProductBrowseInput,
  ProductBrowsePage,
  ProductBrowseSort,
} from '@/src/lib/product-browse';
import { formatJalaliDateTime, formatNumberFa, formatRial } from '@/src/lib/format';
import { printDocument } from '@/src/lib/native/print';

const SORT_OPTIONS: { value: ProductBrowseSort; label: string }[] = [
  { value: 'relevance',    label: 'مرتبط‌ترین' },
  { value: 'newest',       label: 'جدیدترین' },
  { value: 'oldest',       label: 'قدیمی‌ترین' },
  { value: 'best_selling', label: 'پرفروش‌ترین' },
  { value: 'most_viewed',  label: 'پربازدید‌ترین' },
  { value: 'alpha_asc',    label: 'الفبا (الف-ی)' },
  { value: 'alpha_desc',   label: 'الفبا (ی-الف)' },
];

function formatCarTypeForPdf(carType: string | null | undefined): string {
  const name = carType?.trim();
  if (!name) return '—';
  return `${name} `;
}

/** Build a Persian print/PDF document title from the active PLP filters. */
function buildPdfTitle(meta: {
  searchQuery: string;
  brandNames: string[];
  carBrandNames: string[];
  carTypes: string[];
  categoryLabels: string[];
  offerOnly: boolean;
}): string {
  const parts: string[] = [];
  const q = meta.searchQuery.trim();
  if (q) parts.push(`جستجو ${q}`);
  if (meta.brandNames.length) parts.push(`برند ${meta.brandNames.join('، ')}`);
  if (meta.carBrandNames.length) parts.push(`خودروساز ${meta.carBrandNames.join('، ')}`);
  if (meta.carTypes.length) parts.push(`مدل ${meta.carTypes.join('، ')}`);
  if (meta.categoryLabels.length) parts.push(`دسته ${meta.categoryLabels.join('، ')}`);
  if (meta.offerOnly) parts.push('پیشنهاد ویژه');

  if (parts.length === 0) return 'لیست قیمت قطعات کارخودرو';
  return `لیست قیمت ${parts.join(' — ')}`;
}

async function openPDFWindow(products: Product[], documentTitle: string) {
  const now = new Date();
  const issuedAt = formatJalaliDateTime(now);
  const safeTitle = documentTitle.trim() || 'لیست قیمت قطعات کارخودرو';

  const rows = products
    .map(
      (p, i) => `
      <tr>
        <td class="center muted">${formatNumberFa(i + 1)}</td>
        <td class="mono muted">${escapeHtml(p.sku)}</td>
        <td class="name">${escapeHtml(p.name)}</td>
        <td class="muted">${escapeHtml(p.brand)}</td>
        <td class="muted">${escapeHtml(formatCarTypeForPdf(p.carType))}</td>
        <td class="center price">${formatRial(p.price)}</td>
      </tr>`,
    )
    .join('');

  const origin = window.location.origin;
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(safeTitle)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#1A1A1A;background:#fff;padding:28px;font-size:13px}
    .sheet{max-width:900px;margin:0 auto}
    .header{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-bottom:18px;border-bottom:1px solid #e5e7eb;margin-bottom:18px}
    .brand{display:flex;align-items:center;gap:12px}
    .brand img{width:110px;height:36px;object-fit:contain}
    .brand h1{font-size:14px;font-weight:700;color:#1A1A1A}
    .brand .sub{font-size:11px;color:#9ca3af;margin-top:2px}
    .meta{font-size:11px;color:#9ca3af;text-align:left;line-height:1.7}
    table{width:100%;border-collapse:collapse;font-size:13px}
    thead tr{background:#F3F4F6}
    th{padding:10px 8px;font-size:12px;font-weight:600;color:#1A1A1A;text-align:right}
    th.center,td.center{text-align:center}
    td{padding:10px 8px;border-bottom:1px solid #f9fafb;vertical-align:middle}
    td.name{font-weight:600;text-align:right}
    td.mono{font-family:ui-monospace,Consolas,monospace;font-size:11px;text-align:right}
    td.muted{color:#6b7280;text-align:right}
    td.price{font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
    .empty{text-align:center;color:#9ca3af;padding:64px 0;font-size:13px}
    @media print{
      body{padding:0}
      thead tr{print-color-adjust:exact;-webkit-print-color-adjust:exact}
      @page{size:A4;margin:12mm 10mm}
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <img src="${origin}/logo.png" alt="کارخودرو" />
        <div>
          <h1>لیست قیمت قطعات کارخودرو،فروشگاه شاه گل</h1>
          <p class="sub">تاریخ صدور: ${issuedAt}</p>
        </div>
      </div>
      <div class="meta">
        <p>تعداد اقلام: ${formatNumberFa(products.length)}</p>
      </div>
    </div>
    ${
      products.length === 0
        ? `<p class="empty">موردی مطابق با فیلترهای انتخابی یافت نشد.</p>`
        : `<table>
      <thead>
        <tr>
          <th class="center">ردیف</th>
          <th>کد</th>
          <th>نام قطعه</th>
          <th>برند</th>
          <th>مدل خودرو</th>
          <th class="center">قیمت (ریال)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
    }
  </div>
</body>
</html>`;

  await printDocument({ html, title: safeTitle });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toggleValue(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
}

interface Props {
  initialPage: ProductBrowsePage;
  browseInput: ProductBrowseInput;
  allBrands: { slug: string; name: string }[];
  allCarBrands: { slug: string; name: string }[];
  allCarTypes: string[];
  allCategories: { key: string; label: string }[];
}

export default function ProductsBrowser({
  initialPage,
  browseInput,
  allBrands,
  allCarBrands,
  allCarTypes,
  allCategories,
}: Props) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState(initialPage.items);
  const [total, setTotal] = useState(initialPage.total);
  const [nextPage, setNextPage] = useState(initialPage.nextPage);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // All filter state is derived from URL — single source of truth
  const searchQuery        = searchParams.get('q') ?? '';
  const selectedBrands     = searchParams.getAll('brand');
  const selectedCarBrands  = searchParams.getAll('carBrand');
  const selectedCarTypes   = searchParams.getAll('car');
  const selectedCategories = searchParams.getAll('category');
  const offerOnly          = searchParams.get('offer') === '1';
  const isSearching        = searchQuery.trim().length > 0;
  const sortBy             = browseInput.sort;

  function buildUrl(updates: Record<string, string | string[] | null>): string {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      params.delete(key);
      if (Array.isArray(val) && val.length > 0) {
        val.forEach(v => params.append(key, v));
      } else if (typeof val === 'string' && val !== '') {
        params.set(key, val);
      }
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function push(url: string) {
    router.replace(url, { scroll: false });
  }

  function handleBrandToggle(b: string)     { push(buildUrl({ brand:    toggleValue(selectedBrands,     b) })); }
  function handleCarBrandToggle(b: string)  { push(buildUrl({ carBrand: toggleValue(selectedCarBrands,  b) })); }
  function handleCarTypeToggle(ct: string)  { push(buildUrl({ car:      toggleValue(selectedCarTypes,   ct) })); }
  function handleCategoryToggle(c: string)  { push(buildUrl({ category: toggleValue(selectedCategories, c) })); }
  function handleOfferToggle()              { push(buildUrl({ offer: offerOnly ? null : '1' })); }
  function handleSortChange(s: ProductBrowseSort)  { push(buildUrl({ sort: s })); }

  function removeFilter(type: string, value: string) {
    switch (type) {
      case 'brand':     push(buildUrl({ brand:    selectedBrands.filter(b => b !== value)      })); break;
      case 'carBrand':  push(buildUrl({ carBrand: selectedCarBrands.filter(b => b !== value)  })); break;
      case 'car':       push(buildUrl({ car:      selectedCarTypes.filter(c => c !== value)    })); break;
      case 'category':  push(buildUrl({ category: selectedCategories.filter(c => c !== value) })); break;
      case 'offer':     push(buildUrl({ offer: null })); break;
      case 'q':         push(buildUrl({ q: null })); break;
    }
  }

  function clearAll() { push(pathname); }

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);
    setLoadError(false);
    try {
      const page = await getProductBrowsePage({ ...browseInput, page: nextPage });
      if (page.failed) {
        setLoadError(true);
        return;
      }
      setProducts((current) => {
        const knownIds = new Set(current.map((product) => product.id));
        return [...current, ...page.items.filter((product) => !knownIds.has(product.id))];
      });
      setTotal(page.total);
      setNextPage(page.nextPage);
      setHasMore(page.hasMore);
    } catch {
      setLoadError(true);
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [browseInput, hasMore, nextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore();
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadError, loadMore]);

  const activeFilterCount =
    selectedBrands.length +
    selectedCarBrands.length +
    selectedCarTypes.length +
    selectedCategories.length +
    (offerOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  type AppliedFilter = { type: string; value: string; label: string };
  const appliedFilters: AppliedFilter[] = [
    ...selectedBrands.map(b     => ({
      type: 'brand',
      value: b,
      label: allBrands.find(a => a.slug === b)?.name ?? b,
    })),
    ...selectedCarBrands.map(b => ({
      type: 'carBrand',
      value: b,
      label: allCarBrands.find(a => a.slug === b)?.name ?? b,
    })),
    ...selectedCarTypes.map(c   => ({ type: 'car',      value: c,  label: c })),
    ...selectedCategories.map(c => ({
      type: 'category',
      value: c,
      label: allCategories.find(a => a.key === c)?.label ?? c,
    })),
    ...(offerOnly ? [{ type: 'offer', value: '1', label: 'پیشنهاد ویژه' }] : []),
    ...(searchQuery.trim() ? [{ type: 'q', value: searchQuery, label: `جستجو: ${searchQuery}` }] : []),
  ];

  return (
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
            selectedBrands={selectedBrands}
            onBrandToggle={handleBrandToggle}
            selectedCarBrands={selectedCarBrands}
            onCarBrandToggle={handleCarBrandToggle}
            selectedCarTypes={selectedCarTypes}
            onCarTypeToggle={handleCarTypeToggle}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            offerOnly={offerOnly}
            onOfferToggle={handleOfferToggle}
            onClearAll={clearAll}
            onRemoveFilter={removeFilter}
            onExportPDF={async () => {
              const brandNames = selectedBrands
                .map((slug) => allBrands.find((b) => b.slug === slug)?.name ?? slug);
              const carBrandNames = selectedCarBrands
                .map((slug) => allCarBrands.find((b) => b.slug === slug)?.name ?? slug);
              const categoryLabels = selectedCategories
                .map((key) => allCategories.find((c) => c.key === key)?.label ?? key);
              const title = buildPdfTitle({
                  searchQuery,
                  brandNames,
                  carBrandNames,
                  carTypes: selectedCarTypes,
                  categoryLabels,
                  offerOnly,
                });
              setExporting(true);
              try {
                const exportProducts = await getProductsForExport(browseInput);
                await openPDFWindow(exportProducts, title);
              } finally {
                setExporting(false);
              }
            }}
            exporting={exporting}
            allBrands={allBrands}
            allCarBrands={allCarBrands}
            allCarTypes={allCarTypes}
            allCategories={allCategories}
            activeFilterCount={activeFilterCount}
            appliedFilters={appliedFilters}
          />
        </div>

        {/* Main content */}
        <div className="min-w-0">
          {/* Top bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-gray-600">
              تعداد کالاها:{' '}
              <span className="font-bold text-charcoal">
                {total.toLocaleString('fa-IR')}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="plp-sort" className="text-sm text-gray-500 whitespace-nowrap">
                مرتب‌سازی:
              </label>
              <select
                id="plp-sort"
                value={sortBy}
                onChange={e => handleSortChange(e.target.value as ProductBrowseSort)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-charcoal bg-white focus:outline-none focus:border-accent transition-colors cursor-pointer"
              >
                {SORT_OPTIONS.filter(opt => isSearching || opt.value !== 'relevance').map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product grid */}
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3 lg:gap-3 xl:grid-cols-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} variant="plp" />
                ))}
              </div>

              {hasMore ? (
                <div
                  ref={sentinelRef}
                  className="flex justify-center items-center py-10"
                  aria-label="در حال بارگذاری محصولات"
                >
                  {loadError ? (
                    <button
                      type="button"
                      onClick={() => void loadMore()}
                      className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-charcoal hover:border-accent"
                    >
                      تلاش دوباره
                    </button>
                  ) : loadingMore ? (
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="h-8" aria-hidden="true" />
                  )}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-8 select-none">
                  همه محصولات نمایش داده شد
                </p>
              )}
            </>
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
    </div>
  );
}
