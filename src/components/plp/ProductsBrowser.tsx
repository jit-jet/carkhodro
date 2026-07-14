'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import FilterSidebar from '@/src/components/plp/FilterSidebar';
import ProductCard from '@/src/components/ui/ProductCard';
import { searchProducts } from '@/actions/search';
import type { ProductVM as Product } from '@/src/lib/serializers';

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
        <td>${p.stock > 0 ? 'موجود' : 'ناموجود'}</td>
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

interface Props {
  products: Product[];
  allBrands: string[];
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

    if (selectedBrands.length)     result = result.filter(p => selectedBrands.includes(p.brand));
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
    ...selectedBrands.map(b     => ({ type: 'brand',    value: b,  label: b })),
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
