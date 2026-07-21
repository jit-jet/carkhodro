'use client';

import { useState } from 'react';

type AppliedFilter = { type: string; value: string; label: string };

interface FilterSidebarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedBrands: string[];
  onBrandToggle: (brand: string) => void;
  selectedCarTypes: string[];
  onCarTypeToggle: (carType: string) => void;
  selectedCategories: string[];
  onCategoryToggle: (cat: string) => void;
  onClearAll: () => void;
  onRemoveFilter: (type: string, value: string) => void;
  onExportPDF: () => void;
  allBrands: { slug: string; name: string }[];
  allCarTypes: string[];
  allCategories: { key: string; label: string }[];
  activeFilterCount: number;
  appliedFilters: AppliedFilter[];
}

function AccordionSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 text-sm font-semibold text-charcoal hover:text-accent transition-colors duration-150"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="pb-3 space-y-2.5">{children}</div>}
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
      {/* Real checkbox drives keyboard/screen-reader behaviour; visually hidden */}
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        aria-hidden="true"
        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked
            ? 'bg-accent border-accent'
            : 'border-gray-300 group-hover:border-accent'
        }`}
      >
        {checked && (
          <svg
            className="w-2.5 h-2.5 text-charcoal"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </div>
      <span className="text-sm text-gray-600 group-hover:text-charcoal transition-colors">
        {label}
      </span>
    </label>
  );
}

export default function FilterSidebar({
  searchQuery,
  onSearchChange,
  selectedBrands,
  onBrandToggle,
  selectedCarTypes,
  onCarTypeToggle,
  selectedCategories, 
  onCategoryToggle,
  onClearAll,
  onRemoveFilter,
  onExportPDF,
  allBrands,
  allCarTypes,
  allCategories,
  activeFilterCount,
  appliedFilters,
}: FilterSidebarProps) {
  return (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-charcoal">فیلترها</h2>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            حذف همه ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Applied filter chips */}
      {appliedFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {appliedFilters.map(f => (
            <span
              key={`${f.type}-${f.value}`}
              className="inline-flex items-center gap-1 bg-accent/10 border border-accent/30 text-charcoal text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {f.label}
              <button
                onClick={() => onRemoveFilter(f.type, f.value)}
                aria-label={`حذف فیلتر ${f.label}`}
                className="text-gray-400 hover:text-red-500 transition-colors leading-none"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6"  y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="جستجو در محصولات..."
          className="w-full border border-gray-200 rounded-xl py-2.5 ps-3 pe-9 text-sm text-charcoal placeholder-gray-400 focus:outline-none focus:border-accent transition-colors"
        />
        <svg
          className="absolute top-1/2 -translate-y-1/2 inset-e-3 w-4 h-4 text-gray-400 pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      <div className="h-px bg-gray-100 mb-1" />

      {/* Brand */}
      <AccordionSection title="برند">
        {allBrands.map(brand => (
          <CheckItem
            key={brand.slug}
            label={brand.name}
            checked={selectedBrands.includes(brand.slug)}
            onChange={() => onBrandToggle(brand.slug)}
          />
        ))}
      </AccordionSection>

      {/* Car Type */}
      <AccordionSection title="نوع خودرو">
        {allCarTypes.map(ct => (
          <CheckItem
            key={ct}
            label={ct}
            checked={selectedCarTypes.includes(ct)}
            onChange={() => onCarTypeToggle(ct)}
          />
        ))}
      </AccordionSection>

      {/* Category */}
      <AccordionSection title="دسته‌بندی" defaultOpen={false}>
        {allCategories.map(cat => (
          <CheckItem
            key={cat.key}
            label={cat.label}
            checked={selectedCategories.includes(cat.key)}
            onChange={() => onCategoryToggle(cat.key)}
          />
        ))}
      </AccordionSection>

      {/* PDF export */}
      <button
        onClick={onExportPDF}
        className="mt-5 w-full flex items-center justify-center gap-2 bg-charcoal hover:bg-gray-800 active:scale-95 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-150"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        دانلود PDF
      </button>
    </aside>
  );
}
