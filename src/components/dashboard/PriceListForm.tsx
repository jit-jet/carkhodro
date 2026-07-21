'use client';

/**
 * Price-list request builder.
 * ───────────────────────────
 * Optional product-name titles (add several as chips), parts-brand checkboxes
 * and car-model checkboxes (empty = all). Submits via `createPriceListRequest`
 * and navigates to the generated, printable list (downloaded as PDF from there).
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPriceListRequest } from '@/actions/price-list';

interface BrandOption {
  id: number;
  name: string;
}
interface CarOption {
  id: number;
  name: string;
  brandName: string;
}

export default function PriceListForm({
  brands,
  cars,
}: {
  brands: BrandOption[];
  cars: CarOption[];
}) {
  const router = useRouter();
  const [titleDraft, setTitleDraft] = useState('');
  const [titles, setTitles] = useState<string[]>([]);
  const [brandIds, setBrandIds] = useState<Set<number>>(new Set());
  const [carIds, setCarIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function addTitle() {
    const t = titleDraft.trim();
    if (!t || titles.includes(t)) {
      setTitleDraft('');
      return;
    }
    setTitles((prev) => [...prev, t]);
    setTitleDraft('');
  }

  function toggle<T>(set: Set<T>, setter: (s: Set<T>) => void, value: T) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function submit() {
    setError('');
    const pendingTitle = titleDraft.trim();
    const submittedTitles =
      pendingTitle && !titles.includes(pendingTitle) ? [...titles, pendingTitle] : titles;
    startTransition(async () => {
      const result = await createPriceListRequest({
        titles: submittedTitles,
        partsBrandIds: [...brandIds],
        carModelIds: [...carIds],
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/price-list/${result.data.id}`);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-7">
      <div>
        <h1 className="text-lg font-extrabold text-charcoal mb-1">دریافت لیست قیمت</h1>
        <p className="text-xs text-gray-400">
          فیلترها را انتخاب کنید و لیست قیمت اختصاصی خود را با فرمت PDF دریافت نمایید. (خالی گذاشتن هر بخش یعنی همه موارد)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Titles */}
      <div>
        <label className="block text-sm font-bold text-charcoal mb-2">نام محصول</label>
        <div className="flex gap-2">
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTitle();
              }
            }}
            placeholder="عنوان قطعه…"
            className="flex-1 border-2 border-silver focus:border-accent rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
          />
          <button
            type="button"
            onClick={addTitle}
            className="bg-silver-light hover:bg-gray-200 text-charcoal font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            + افزودن عنوان
          </button>
        </div>
        {titles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {titles.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 bg-amber-50 text-accent-dark text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setTitles((prev) => prev.filter((x) => x !== t))}
                  aria-label="حذف عنوان"
                  className="hover:text-red-500"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Brands */}
      <CheckboxGroup
        title="برندها را انتخاب کنید"
        hint="اگر خالی باشد همه برندها"
        options={brands.map((b) => ({ id: b.id, label: b.name }))}
        selected={brandIds}
        onToggle={(id) => toggle(brandIds, setBrandIds, id)}
      />

      {/* Vehicle models (CarModel) */}
      <CheckboxGroup
        title="مدل خودرو را انتخاب کنید"
        hint="اگر خالی باشد همه مدل‌ها"
        options={cars.map((c) => ({
          id: c.id,
          label: c.brandName ? `${c.brandName} — ${c.name}` : c.name,
        }))}
        selected={carIds}
        onToggle={(id) => toggle(carIds, setCarIds, id)}
      />

      <button
        onClick={submit}
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm py-3.5 rounded-xl transition-colors disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {pending ? 'در حال ساخت لیست…' : 'دریافت لیست قیمت با فرمت PDF'}
      </button>

      <ul className="text-xs text-gray-400 space-y-1 list-disc pe-5">
        <li>تا حد ممکن جستجو را محدود کنید تا فایل کوچک و کاربردی در اختیار شما قرار بگیرد.</li>
        <li>این لیست با ساختار PDF در اختیار شما قرار می‌گیرد و تا ۲۴ ساعت اعتبار دارد.</li>
      </ul>
    </div>
  );
}

function CheckboxGroup({
  title,
  hint,
  options,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  options: { id: number; label: string }[];
  selected: Set<number>;
  onToggle: (id: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-bold text-charcoal">{title}</h2>
        <span className="text-[11px] text-accent-dark">{hint}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {options.map((o) => {
          const checked = selected.has(o.id);
          return (
            <label
              key={o.id}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors text-sm',
                checked ? 'border-accent bg-amber-50' : 'border-gray-200 hover:bg-silver-light',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.id)}
                className="w-4 h-4 accent-accent-dark shrink-0"
              />
              <span className="text-charcoal truncate">{o.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
