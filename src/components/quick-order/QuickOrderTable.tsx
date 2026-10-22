'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { getProductBrowsePage } from '@/actions/product-browser';
import { addToCart } from '@/actions/cart';
import { ProductImage } from '@/src/components/product/ProductImageWatermark';
import CallForPrice from '@/src/components/product/CallForPrice';
import { productBrowseInputFromParams, type ProductBrowseInput, type ProductBrowsePage } from '@/src/lib/product-browse';
import AdminPagination from '@/src/components/admin/AdminPagination';
import { ADMIN_DEFAULT_PER_PAGE } from '@/src/lib/admin-pagination';
import styles from './QuickOrderTable.module.css';
import type { ProductVM } from '@/src/lib/serializers';
import { handleAddToCartResult, useCartUI } from '@/src/store/cart-ui';
import { quickOrderQuantity, quickOrderRowIndex } from '@/src/lib/quick-order';
import { toEnglishDigits } from '@/src/lib/persian';

type Filters = {
  brands: { slug: string; name: string }[];
  carBrands: { slug: string; name: string }[];
  carTypes: string[];
  categories: { key: string; label: string }[];
};
const control = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30';
const number = (n: number) => n.toLocaleString('fa-IR');

export default function QuickOrderTable({ initialPage, filters, cartHref }: {
  initialPage: ProductBrowsePage; filters: Filters; cartHref: string;
}) {
  const [input, setInput] = useState<ProductBrowseInput>(() => productBrowseInputFromParams({}));
  const [data, setData] = useState(initialPage);
  const [perPage, setPerPage] = useState<number>(ADMIN_DEFAULT_PER_PAGE);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);
  const requestVersion = useRef(0);
  const mutationLock = useRef(false);
  const rows = useRef(new Map<string, HTMLTableRowElement>());
  const notify = useCartUI(s => s.notify);
  const selectedIndex = data.items.findIndex(p => p.id === selectedId);
  const selected = data.items[selectedIndex];

  useEffect(() => {
    if (requestVersion.current === 0) return;
    const version = requestVersion.current;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await getProductBrowsePage(input, perPage);
        if (!cancelled && version === requestVersion.current) setData(result);
      } catch {
        if (!cancelled && version === requestVersion.current) setData({ items: [], total: 0, hasMore: false, nextPage: input.page + 1, failed: true });
      } finally {
        if (!cancelled && version === requestVersion.current) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [input, perPage, retry]);

  useEffect(() => {
    const firstProduct = data.items[0];
    if (selectedId || !firstProduct || loading || data.failed) return;

    function selectFirstRow(event: globalThis.KeyboardEvent) {
      if (event.defaultPrevented || event.key !== 'ArrowDown' || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, select, textarea, button, a, [contenteditable="true"]')) return;

      event.preventDefault();
      setSelectedId(firstProduct.id);
      const row = rows.current.get(firstProduct.id);
      row?.focus({ preventScroll: true });
      row?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    document.addEventListener('keydown', selectFirstRow);
    return () => document.removeEventListener('keydown', selectFirstRow);
  }, [data.failed, data.items, loading, selectedId]);

  function change(patch: Partial<ProductBrowseInput>) {
    requestVersion.current++;
    setMessage('');
    setLoading(true);
    setSelectedId('');
    setInput(previous => ({ ...previous, ...patch, page: patch.page ?? 1 }));
  }

  function stepQuantity(product: ProductVM, direction: -1 | 1) {
    setQuantities(previous => {
      const raw = toEnglishDigits(previous[product.id] ?? '1');
      const candidate = /^\d+$/.test(raw) ? Number(raw) : 1;
      const parsed = Number.isSafeInteger(candidate) && candidate > 0 ? candidate : 1;
      const cap = product.orderQuantityCap;
      const current = Math.max(1, cap === null ? parsed : Math.min(parsed, Math.max(1, cap)));
      const next = direction === 1
        ? (cap === null ? current + 1 : Math.min(cap, current + 1))
        : Math.max(1, current - 1);
      return { ...previous, [product.id]: String(next) };
    });
  }

  function focusRow(index: number) {
    const product = data.items[index];
    if (!product) return;
    setSelectedId(product.id);
    const row = rows.current.get(product.id);
    row?.focus({ preventScroll: true });
    row?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  async function buy(product: ProductVM) {
    if (mutationLock.current || loading || data.failed || product.callForPrice || product.stock < 1) return;
    const quantity = quickOrderQuantity(quantities[product.id] ?? '1', product.orderQuantityCap);
    if (quantity === null) {
      notify({ variant: 'error', title: 'تعداد نامعتبر', description: 'تعداد باید عدد صحیح مثبت و در محدوده موجودی مجاز باشد.' });
      return;
    }
    mutationLock.current = true;
    setAddingId(product.id);
    try {
      const result = await addToCart(product.id, quantity);
      if (!result.ok) {
        setMessage(result.error);
        notify({ variant: 'error', title: 'افزودن انجام نشد', description: result.error });
        return;
      }
      handleAddToCartResult(product.name, quantity, result.data);
      setMessage(result.data.stockCapped ? 'تعداد سبد با موجودی مجاز تنظیم شد.' : `${product.name} — ${number(quantity)} عدد به سبد اضافه شد.`);
    } catch {
      setMessage('ارتباط برقرار نشد. لطفاً وضعیت سبد خرید را بررسی کنید.');
      notify({ variant: 'error', title: 'خطا در ارتباط', description: 'پیش از تلاش دوباره، سبد خرید را بررسی کنید.' });
    } finally {
      mutationLock.current = false;
      setAddingId(null);
    }
  }

  function keyboard(event: KeyboardEvent<HTMLTableElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || loading) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusRow(quickOrderRowIndex(selectedIndex, event.key === 'ArrowDown' ? 1 : -1, data.items.length));
    } else if (event.key === 'Enter') {
      // Links retain their normal keyboard navigation; quantity and row Enter add to cart.
      if ((event.target as HTMLElement).closest('a')) return;
      event.preventDefault();
      if (!event.repeat && selected) void buy(selected);
    }
  }

  const pages = Math.max(1, Math.ceil(data.total / perPage));
  return <div className="space-y-4">
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-gray-500 sm:col-span-2">جست‌وجوی نام یا کد قطعه
          <input className={`${control} mt-1`} type="search" value={input.query} placeholder="مثلاً لنت ترمز یا کد کالا…"
            onChange={e => change({ query: e.target.value, sort: e.target.value.trim() ? 'relevance' : 'newest' })}
            onKeyDown={e => { if (e.key === 'Enter' && !loading) { e.preventDefault(); focusRow(0); } }} />
        </label>
        <label className="text-xs font-semibold text-gray-500">دسته‌بندی
          <select className={`${control} mt-1`} value={input.categories[0] ?? ''} onChange={e => change({ categories: e.target.value ? [e.target.value] : [] })}>
            <option value="">همه دسته‌ها</option>{filters.categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-500">برند قطعه
          <select className={`${control} mt-1`} value={input.brands[0] ?? ''} onChange={e => change({ brands: e.target.value ? [e.target.value] : [] })}>
            <option value="">همه برندها</option>{filters.brands.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-500">برند خودرو
          <select className={`${control} mt-1`} value={input.carBrands[0] ?? ''} onChange={e => change({ carBrands: e.target.value ? [e.target.value] : [] })}>
            <option value="">همه خودروسازها</option>{filters.carBrands.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-500">مدل خودرو
          <select className={`${control} mt-1`} value={input.carTypes[0] ?? ''} onChange={e => change({ carTypes: e.target.value ? [e.target.value] : [] })}>
            <option value="">همه مدل‌ها</option>{filters.carTypes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-500">مرتب‌سازی
          <select className={`${control} mt-1`} value={input.sort} onChange={e => change({ sort: e.target.value as ProductBrowseInput['sort'] })}>
            {input.query.trim() && <option value="relevance">مرتبط‌ترین</option>}
            <option value="newest">جدیدترین</option><option value="oldest">قدیمی‌ترین</option>
            <option value="best_selling">پرفروش‌ترین</option><option value="most_viewed">پربازدیدترین</option>
            <option value="alpha_asc">نام: الف تا ی</option><option value="alpha_desc">نام: ی تا الف</option>
          </select>
        </label>
        <div className="flex items-center justify-between gap-3 pt-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-amber-500" checked={input.offerOnly} onChange={e => change({ offerOnly: e.target.checked })} />پیشنهاد ویژه</label>
          <button className="text-gray-500 underline" onClick={() => change(productBrowseInputFromParams({}))}>پاک کردن فیلترها</button>
        </div>
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p id="quick-order-help" className="text-gray-500">روی یک ردیف کلیک کنید؛ ↑ ↓ انتخاب محصول، Enter افزودن به سبد.</p>
      <Link href={cartHref} className="rounded-xl bg-charcoal px-5 py-2.5 font-bold text-white">مشاهده سبد خرید ←</Link>
    </div>
    <div role="status" aria-live="polite" className="min-h-5 text-sm text-gray-600">{loading ? 'در حال دریافت محصولات…' : message || `${number(data.total)} محصول`}</div>

    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm" aria-busy={loading}>
      <table className={`${styles.table} w-full border-collapse text-right text-sm ${loading ? 'opacity-50' : ''}`} onKeyDown={keyboard} aria-describedby="quick-order-help">
        <caption className="sr-only">جدول خرید سریع قطعات خودرو</caption>
        <colgroup>{[4, 6, 22, 12, 11, 13, 14, 7, 11].map((width, i) => <col key={i} style={{ width: `${width}%` }} />)}</colgroup>
        <thead className="bg-gray-100 text-xs text-gray-500"><tr>
          {['ردیف', 'تصویر', 'نام قطعه / کد کالا', 'برند قطعه', 'دسته‌بندی', 'مدل خودرو', 'قیمت واحد (تومان)', 'تعداد', 'خرید'].map(h => <th key={h} scope="col" className="border-b border-l border-gray-200 px-3 py-3 font-semibold">{h}</th>)}
        </tr></thead>
        <tbody>{!data.failed && data.items.map((product, index) => {
          const active = selected?.id === product.id;
          const blocked = loading || product.stock < 1 || product.callForPrice;
          const rawQuantity = quantities[product.id] ?? '1';
          const parsedQuantity = /^\d+$/.test(rawQuantity) ? Number(rawQuantity) : 1;
          const quantityForControls = Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
          const atQuantityCap = product.orderQuantityCap !== null && quantityForControls >= product.orderQuantityCap;
          return <tr key={product.id} ref={element => { if (element) rows.current.set(product.id, element); else rows.current.delete(product.id); }}
            tabIndex={active ? 0 : -1} aria-selected={active}
            onFocus={() => setSelectedId(product.id)} onClick={event => {
              setSelectedId(product.id);
              if (!(event.target as HTMLElement).closest('a, button, input')) event.currentTarget.focus({ preventScroll: true });
            }}
            className={`border-b border-gray-100 outline-none focus:ring-2 focus:ring-inset focus:ring-accent ${active ? 'bg-amber-50' : index % 2 ? 'bg-gray-50/50 hover:bg-amber-50/50' : 'hover:bg-amber-50/50'}`}>
            <td data-label="ردیف" className="border-l border-gray-100 px-3 py-3 text-xs text-gray-400">{number((input.page - 1) * perPage + index + 1)}</td>
            <td className="border-l border-gray-100 p-2"><Thumbnail product={product} /></td>
            <td className="border-l border-gray-100 px-3 py-3"><Link href={`/products/${product.id}`} className="font-semibold leading-6 hover:underline">{product.name}</Link><div className="mt-1 text-xs text-gray-400">کد: <span dir="ltr">{product.sku || '—'}</span></div></td>
            <td data-label="برند قطعه" className="border-l border-gray-100 px-3 py-3">{product.brand}</td>
            <td data-label="دسته‌بندی" className="border-l border-gray-100 px-3 py-3">{product.categoryLabel}</td>
            <td data-label="مدل خودرو" className="border-l border-gray-100 px-3 py-3">{product.carType || '—'}</td>
            <td data-label="قیمت واحد (تومان)" className="border-l border-gray-100 px-3 py-3">{product.callForPrice ? <CallForPrice pendingApproval={product.pendingApproval} compact /> : product.stock < 1 ? <span className="text-gray-400">—</span> : <><span className="font-bold tabular-nums">{number(product.price)}</span>{product.oldPrice && <del className="mr-2 text-xs text-gray-400">{number(product.oldPrice)}</del>}</>}</td>
            <td data-label="تعداد" className="border-l border-gray-100 px-3 py-3">
              <div dir="ltr" className="flex w-full max-w-20 overflow-hidden rounded-lg border border-gray-200 bg-white focus-within:border-accent">
                <input aria-label={`تعداد ${product.name}`} disabled={blocked} inputMode="numeric" type="text"
                  value={rawQuantity} onChange={e => setQuantities(previous => ({ ...previous, [product.id]: toEnglishDigits(e.target.value) }))}
                  className="min-w-0 w-full bg-white px-1 py-2 text-center outline-none disabled:bg-gray-100" />
                <span className="flex w-6 shrink-0 flex-col border-l border-gray-200">
                  <button type="button" aria-label={`افزایش تعداد ${product.name}`} disabled={blocked || atQuantityCap}
                    onClick={() => stepQuantity(product, 1)} className="flex flex-1 items-center justify-center border-b border-gray-200 text-[9px] leading-none text-gray-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:text-gray-300">▲</button>
                  <button type="button" aria-label={`کاهش تعداد ${product.name}`} disabled={blocked || quantityForControls <= 1}
                    onClick={() => stepQuantity(product, -1)} className="flex flex-1 items-center justify-center text-[9px] leading-none text-gray-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:text-gray-300">▼</button>
                </span>
              </div>
            </td>
            <td className="px-3 py-3"><button disabled={blocked || addingId !== null} onClick={() => void buy(product)} className="w-full rounded-lg bg-accent px-2 py-2 font-bold text-charcoal hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400">{addingId === product.id ? 'در حال افزودن…' : 'افزودن به سبد'}</button></td>
          </tr>;
        })}</tbody>
      </table>
      {data.failed && !loading && <div className="p-10 text-center text-sm text-red-600">دریافت محصولات ناموفق بود. <button className="underline" onClick={() => { requestVersion.current++; setLoading(true); setRetry(n => n + 1); }}>تلاش دوباره</button></div>}
      {!data.failed && !data.items.length && !loading && <p className="p-12 text-center text-gray-500">محصولی با این جست‌وجو و فیلترها پیدا نشد.</p>}
    </div>
    <fieldset disabled={loading} className="min-w-0 disabled:opacity-50">
      <legend className="sr-only">صفحه‌بندی محصولات</legend>
      <AdminPagination page={input.page} pageCount={pages} total={data.total} perPage={perPage}
        onPageChange={page => change({ page })}
        onPerPageChange={size => { setPerPage(size); change({ page: 1 }); }} />
    </fieldset>
  </div>;
}

function Thumbnail({ product }: { product: ProductVM }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-center text-[9px] text-gray-400" aria-label={`تصویر ${product.name} در دسترس نیست`}>بدون تصویر</span>;
  return <ProductImage src={product.mainImage} alt={product.name} width={48} height={48} onError={() => setFailed(true)} className="h-12 w-12 rounded-lg bg-white object-contain" />;
}
