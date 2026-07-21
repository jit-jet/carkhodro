'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import FilterSidebar from '@/src/components/plp/FilterSidebar';
import ProductCard from '@/src/components/ui/ProductCard';
import { searchProducts } from '@/actions/search';
import type { ProductVM as Product } from '@/src/lib/serializers';
import { formatJalaliDateTime, formatNumberFa, formatRial } from '@/src/lib/format';

const PAGE_SIZE = 12;
/** Upper bound on fuzzy-search results pulled for the results page. */
const SEARCH_RESULT_CAP = 200;

type SortOption = 'newest' | 'oldest' | 'best_selling' | 'most_viewed' | 'alpha_asc' | 'alpha_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',       label: 'جدیدترین' },
  { value: 'oldest',       label: 'قدیمی‌ترین' },
  { value: 'best_selling', label: 'پرفروش‌ترین' },
  { value: 'most_viewed',  label: 'پربازدید‌ترین' },
  { value: 'alpha_asc',    label: 'الفبا (الف-ی)' },
  { value: 'alpha_desc',   label: 'الفبا (ی-الف)' },
];

function stockFirst(a: Product, b: Product): number {
  return (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0);
}

function applySorting(products: Product[], sort: SortOption): Product[] {
  const arr = [...products];
  switch (sort) {
    case 'newest':       return arr.sort((a, b) => stockFirst(a, b) || b.createdDate.localeCompare(a.createdDate));
    case 'oldest':       return arr.sort((a, b) => stockFirst(a, b) || a.createdDate.localeCompare(b.createdDate));
    case 'best_selling': return arr.sort((a, b) => stockFirst(a, b) || b.salesCount - a.salesCount);
    case 'most_viewed':  return arr.sort((a, b) => stockFirst(a, b) || b.viewCount - a.viewCount);
    case 'alpha_asc':    return arr.sort((a, b) => stockFirst(a, b) || a.name.localeCompare(b.name, 'fa'));
    case 'alpha_desc':   return arr.sort((a, b) => stockFirst(a, b) || b.name.localeCompare(a.name, 'fa'));
  }
}

const PRICE_LIST_VALID_HOURS = 24;

function openPDFWindow(products: Product[]) {
  const now = new Date();
  const expires = new Date(now.getTime() + PRICE_LIST_VALID_HOURS * 60 * 60 * 1000);
  const issuedAt = formatJalaliDateTime(now);
  const expiresAt = formatJalaliDateTime(expires);

  const rows = products
    .map(
      (p, i) => `
      <tr>
        <td class="center muted">${formatNumberFa(i + 1)}</td>
        <td class="mono muted">${escapeHtml(p.sku)}</td>
        <td class="name">${escapeHtml(p.name)}</td>
        <td class="muted">${escapeHtml(p.brand)}</td>
        <td class="muted">${escapeHtml(p.carType || '—')}</td>
        <td class="center price">${formatRial(p.price)}</td>
      </tr>`,
    )
    .join('');

  const origin = window.location.origin;
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>لیست قیمت قطعات کارخودرو</title>
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
          <h1>لیست قیمت قطعات کارخودرو</h1>
          <p class="sub">تاریخ صدور: ${issuedAt}</p>
        </div>
      </div>
      <div class="meta">
        <p>اعتبار تا: ${expiresAt}</p>
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
          <th>خودرو</th>
          <th class="center">قیمت (ریال)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
    }
  </div>
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
  products: Product[];
  allBrands: { slug: string; name: string }[];
  allCarTypes: string[];
  allCategories: { key: string; label: string }[];
}

export default function ProductsBrowser({
  products,
  allBrands,
  allCarTypes,
  allCategories,
}: Props) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Typo-tolerant text search runs server-side (pg_trgm); the facet filters and
  // sorting below still run client-side over the matched set. `searchResults` is
  // null while idle (no query) and an array once results stream in.
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // All filter state is derived from URL — single source of truth
  const searchQuery        = searchParams.get('q') ?? '';
  const selectedBrands     = searchParams.getAll('brand');
  const selectedCarTypes   = searchParams.getAll('car');
  const selectedCategories = searchParams.getAll('category');
  const sortBy             = (searchParams.get('sort') ?? 'newest') as SortOption;

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

  function handleSearchChange(v: string)    { push(buildUrl({ q: v || null })); }
  function handleBrandToggle(b: string)     { push(buildUrl({ brand:    toggleValue(selectedBrands,     b) })); }
  function handleCarTypeToggle(ct: string)  { push(buildUrl({ car:      toggleValue(selectedCarTypes,   ct) })); }
  function handleCategoryToggle(c: string)  { push(buildUrl({ category: toggleValue(selectedCategories, c) })); }
  function handleSortChange(s: SortOption)  { push(buildUrl({ sort: s })); }

  function removeFilter(type: string, value: string) {
    switch (type) {
      case 'brand':    push(buildUrl({ brand:    selectedBrands.filter(b => b !== value)      })); break;
      case 'car':      push(buildUrl({ car:      selectedCarTypes.filter(c => c !== value)    })); break;
      case 'category': push(buildUrl({ category: selectedCategories.filter(c => c !== value) })); break;
      case 'q':        push(buildUrl({ q: null })); break;
    }
  }

  function clearAll() { push(pathname); }

  // Debounced fuzzy search. When `q` is set, the matched set comes from the
  // server (typo-tolerant pg_trgm); otherwise we browse the full catalogue.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setSearchResults(null); setSearchLoading(false); return; }
    setSearchLoading(true);
    let active = true;
    const timer = setTimeout(async () => {
      const found = await searchProducts(q, SEARCH_RESULT_CAP);
      if (!active) return;
      setSearchResults(found);
      setSearchLoading(false);
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    // Base set: fuzzy matches when searching (empty until they arrive), else the
    // full catalogue passed from the server.
    let result = searchQuery.trim() ? (searchResults ?? []) : products;

    if (selectedBrands.length)     result = result.filter(p => selectedBrands.includes(p.brandSlug));
    if (selectedCarTypes.length)   result = result.filter(p => selectedCarTypes.includes(p.carType));
    if (selectedCategories.length) result = result.filter(p => selectedCategories.includes(p.category));

    return applySorting(result, sortBy);
  }, [products, searchQuery, searchResults, selectedBrands, selectedCarTypes, selectedCategories, sortBy]);

  // Reset pagination whenever filters or sort change
  const filterKey = [searchQuery, ...selectedBrands, ...selectedCarTypes, ...selectedCategories, sortBy].join('|');
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  );
  const hasMore = visibleProducts.length < filteredProducts.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(c => c + PAGE_SIZE);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  const activeFilterCount =
    selectedBrands.length +
    selectedCarTypes.length +
    selectedCategories.length +
    (searchQuery.trim() ? 1 : 0);

  type AppliedFilter = { type: string; value: string; label: string };
  const appliedFilters: AppliedFilter[] = [
    ...selectedBrands.map(b     => ({
      type: 'brand',
      value: b,
      label: allBrands.find(a => a.slug === b)?.name ?? b,
    })),
    ...selectedCarTypes.map(c   => ({ type: 'car',      value: c,  label: c })),
    ...selectedCategories.map(c => ({
      type: 'category',
      value: c,
      label: allCategories.find(a => a.key === c)?.label ?? c,
    })),
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
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            selectedBrands={selectedBrands}
            onBrandToggle={handleBrandToggle}
            selectedCarTypes={selectedCarTypes}
            onCarTypeToggle={handleCarTypeToggle}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            onClearAll={clearAll}
            onRemoveFilter={removeFilter}
            onExportPDF={() => openPDFWindow(filteredProducts)}
            allBrands={allBrands}
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
                onChange={e => handleSortChange(e.target.value as SortOption)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-charcoal bg-white focus:outline-none focus:border-accent transition-colors cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product grid */}
          {searchLoading && searchResults === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse"
                />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleProducts.map(product => (
                  <ProductCard key={product.id} product={product} variant="grid" />
                ))}
              </div>

              {hasMore ? (
                <div
                  ref={sentinelRef}
                  className="flex justify-center items-center py-10"
                  aria-label="در حال بارگذاری محصولات"
                >
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
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
