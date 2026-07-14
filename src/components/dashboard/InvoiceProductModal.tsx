'use client';

/**
 * "Search & add to invoice" / "add from previous purchases" modal.
 * ─────────────────────────────────────────────────────────────────
 * Two modes share one UI:
 *   • search   — debounced lookup via the typo-tolerant `searchInvoiceProducts`
 *                (which reuses the storefront's pg_trgm search).
 *   • previous — the partner's previously-purchased parts, passed in as a prop.
 * Each row shows code, title, Rial price, pack/carton sizing, a cash-discount
 * badge and a quantity input with an add button.
 */

import { useState, useEffect, useRef } from 'react';
import { searchInvoiceProducts } from '@/actions/dashboard-cart';
import { formatRial } from '@/src/lib/format';
import type { InvoiceSearchResultVM } from '@/src/lib/dashboard-types';

interface Props {
  mode: 'search' | 'previous';
  previousPurchases: InvoiceSearchResultVM[];
  onAdd: (productId: string, quantity: number) => void;
  onClose: () => void;
  adding: boolean;
}

export default function InvoiceProductModal({
  mode,
  previousPurchases,
  onAdd,
  onClose,
  adding,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InvoiceSearchResultVM[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // Debounced fuzzy search (search mode only). All state updates happen inside
  // the timeout callback (never synchronously in the effect body) so a new query
  // doesn't trigger a cascading render.
  useEffect(() => {
    setHighlightedIndex(-1);
    if (mode !== 'search') return;
    const q = query.trim();
    let active = true;
    const timer = setTimeout(async () => {
      if (q.length < 2) {
        if (active) {
          setResults([]);
          setSearching(false);
        }
        return;
      }
      if (active) setSearching(true);
      const found = await searchInvoiceProducts(q);
      if (active) {
        setResults(found);
        setSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, mode]);

  // Previous-purchases mode: local substring filter over the passed-in list.
  const list =
    mode === 'search'
      ? results
      : query.trim()
        ? previousPurchases.filter(
            (p) => p.name.includes(query.trim()) || p.sku.includes(query.trim()),
          )
        : previousPurchases;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (list.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      onAdd(list[highlightedIndex].id, 1);
    }
  }

  const title = mode === 'search' ? 'جستجو و افزودن به فاکتور' : 'انتخاب از خریدهای قبلی';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-accent">
          <h2 className="font-bold text-charcoal">{title}</h2>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/10 hover:bg-black/20 text-charcoal transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={mode === 'search' ? 'نام قطعه، کد یا برند…' : 'جستجو در خریدهای قبلی…'}
            className="w-full border-2 border-silver focus:border-accent rounded-xl px-4 py-2.5 text-sm outline-none transition-colors mb-4"
          />

          <div className="max-h-[26rem] overflow-y-auto -mx-1 px-1">
            {mode === 'search' && searching ? (
              <p className="text-center text-sm text-gray-400 py-10">در حال جستجو…</p>
            ) : list.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">
                {mode === 'search' && query.trim().length < 2
                  ? 'برای جستجو حداقل دو حرف وارد کنید.'
                  : 'موردی یافت نشد.'}
              </p>
            ) : (
              <ul ref={listRef} className="divide-y divide-gray-50">
                {list.map((p, idx) => (
                  <ProductRow key={p.id} product={p} onAdd={onAdd} adding={adding} highlighted={idx === highlightedIndex} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onAdd,
  adding,
  highlighted,
}: {
  product: InvoiceSearchResultVM;
  onAdd: (productId: string, quantity: number) => void;
  adding: boolean;
  highlighted: boolean;
}) {
  const [qty, setQty] = useState(1);
  const outOfStock = product.stock < 1;

  return (
    <li className={["flex items-center gap-3 py-3", highlighted ? "border-2 border-accent rounded-xl px-2" : ""].join(" ")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-gray-400">{product.sku}</span>
          {product.discountPct > 0 && (
            <span className="text-[10px] font-bold text-red-500 bg-red-50 rounded px-1.5 py-0.5">
              ٪{product.discountPct.toLocaleString('fa-IR')} تخفیف نقدی
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-charcoal truncate mt-0.5">{product.name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          بسته: {product.packQuantity.toLocaleString('fa-IR')} تایی | کارتن:{' '}
          {product.cartonQuantity.toLocaleString('fa-IR')} تایی
        </p>
      </div>

      <div className="text-left shrink-0">
        <p className="text-sm font-bold text-charcoal whitespace-nowrap">{formatRial(product.priceToman)}</p>
        {outOfStock ? (
          <p className="text-[11px] text-red-500 mt-1">ناموجود</p>
        ) : (
          <div className="flex items-center gap-1.5 mt-1.5 justify-end">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center outline-none focus:border-accent"
              aria-label="تعداد"
            />
            <button
              onClick={() => onAdd(product.id, qty)}
              disabled={adding}
              className="bg-accent hover:bg-accent-dark text-charcoal text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              افزودن
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
