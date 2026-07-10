'use client';

/**
 * Cart / invoice builder.
 * ───────────────────────────────
 * Editable line items (qty steppers, per-row select + bulk remove), a fuzzy
 * search-&-add modal and an "add from previous purchases" modal, payment terms +
 * notes, and «ثبت فاکتور» which creates the order. Mutations return the fresh
 * `DashboardCartVM` which is reconciled into local state; the header cart badge is
 * kept in sync via the shared cart-UI store.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  addToInvoice,
  setInvoiceLineQty,
  removeInvoiceLines,
  submitInvoice,
} from '@/actions/dashboard-cart';
import { useCartUI } from '@/src/store/cart-ui';
import { formatRial, tomanInWords, formatNumberFa } from '@/src/lib/format';
import InvoiceProductModal from '@/src/components/dashboard/InvoiceProductModal';
import type { DashboardCartVM, InvoiceSearchResultVM } from '@/src/lib/dashboard-types';

interface Props {
  initialCart: DashboardCartVM;
  previousPurchases: InvoiceSearchResultVM[];
  paymentTerms: string[];
}

export default function CartView({ initialCart, previousPurchases, paymentTerms }: Props) {
  const router = useRouter();
  const setCount = useCartUI((s) => s.setCount);
  const notify = useCartUI((s) => s.notify);

  const [cart, setCart] = useState<DashboardCartVM>(initialCart);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [terms, setTerms] = useState(paymentTerms[0] ?? '');
  const [notes, setNotes] = useState('');
  const [modal, setModal] = useState<'search' | 'previous' | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState('');

  function apply(next: DashboardCartVM) {
    setCart(next);
    setCount(next.totalItems);
  }

  function changeQty(id: string, nextQty: number) {
    const line = cart.lines.find((l) => l.id === id);
    if (!line) return;
    const qty = Math.max(1, Math.min(line.stock, nextQty));
    if (qty === line.quantity) return;
    startTransition(async () => {
      const result = await setInvoiceLineQty(id, qty);
      if (result.ok) apply(result.data);
      else setError(result.error);
    });
  }

  function add(productId: string, quantity: number) {
    startTransition(async () => {
      const result = await addToInvoice(productId, quantity);
      if (result.ok) {
        apply(result.data);
        notify({ variant: 'success', title: 'به فاکتور افزوده شد' });
      } else setError(result.error);
    });
  }

  function removeSelected() {
    if (selected.size === 0) return;
    const ids = [...selected];
    startTransition(async () => {
      const result = await removeInvoiceLines(ids);
      if (result.ok) {
        apply(result.data);
        setSelected(new Set());
      } else setError(result.error);
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError('');
    startSubmit(async () => {
      const result = await submitInvoice({ paymentTerms: terms, notes });
      if (result.ok) {
        setCount(0);
        router.push(`/dashboard/orders/${result.data.id}`);
      } else setError(result.error);
    });
  }

  const empty = cart.lines.length === 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="text-lg font-extrabold text-charcoal">سبد خرید</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setModal('previous')}
              className="flex items-center gap-1.5 text-sm font-semibold text-accent-dark border-2 border-accent/40 hover:bg-amber-50 px-3 py-2 rounded-xl transition-colors"
            >
              انتخاب از خریدهای قبلی
            </button>
            <button
              onClick={() => setModal('search')}
              className="flex items-center gap-1.5 text-sm font-bold text-charcoal bg-accent hover:bg-accent-dark px-3 py-2 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              جستجو و افزودن به فاکتور
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {empty ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm mb-4">سبد خرید شما خالی است. با جستجو، قطعات را به فاکتور اضافه کنید.</p>
            <button
              onClick={() => setModal('search')}
              className="bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              افزودن قطعه
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={removeSelected}
                disabled={selected.size === 0 || pending}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-400 hover:bg-orange-500 px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                حذف انتخاب‌شده‌ها
              </button>
              {pending && <span className="text-xs text-gray-400">در حال به‌روزرسانی…</span>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-gray-400 text-xs border-b border-gray-100">
                    <th className="py-3 px-2 font-medium w-10"></th>
                    <th className="py-3 px-2 font-medium text-right">کد</th>
                    <th className="py-3 px-2 font-medium text-right">قطعه خودرو</th>
                    <th className="py-3 px-2 font-medium">قیمت (ریال)</th>
                    <th className="py-3 px-2 font-medium">تخفیف</th>
                    <th className="py-3 px-2 font-medium">تعداد</th>
                    <th className="py-3 px-2 font-medium">مجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cart.lines.map((line) => (
                    <tr key={line.id} className="text-charcoal">
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          checked={selected.has(line.id)}
                          onChange={() => toggleSelect(line.id)}
                          className="w-4 h-4 accent-accent-dark"
                          aria-label="انتخاب ردیف"
                        />
                      </td>
                      <td className="py-3 px-2 font-mono text-xs text-gray-500 text-right">{line.sku}</td>
                      <td className="py-3 px-2 text-right font-semibold max-w-[16rem]">
                        <span className="block truncate">{line.name}</span>
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap tabular-nums">
                        {formatNumberFa(line.unitPriceToman * 10)}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-500">
                        ٪{line.discountPct.toLocaleString('fa-IR')}
                      </td>
                      <td className="py-3 px-2">
                        <QtyStepper
                          value={line.quantity}
                          max={line.stock}
                          disabled={pending}
                          onChange={(q) => changeQty(line.id, q)}
                        />
                      </td>
                      <td className="py-3 px-2 text-center font-bold whitespace-nowrap tabular-nums">
                        {formatNumberFa(line.lineTotalToman * 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!empty && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Settlement + notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            {/* <div>
              <label className="block text-sm font-semibold text-accent-dark mb-2">
                روش پرداخت را انتخاب کنید:
              </label>
              <select
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full border-2 border-silver focus:border-accent rounded-xl px-4 py-2.5 text-sm outline-none transition-colors bg-white"
              >
                {paymentTerms.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div> */}
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">توضیحات</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="توضیحات سفارش (اختیاری)…"
                className="w-full border-2 border-silver focus:border-accent rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none leading-7"
              />
            </div>
          </div>

          {/* Totals + submit */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
            <div className="text-center mb-1">
              <p className="text-sm text-gray-400">جمع کل سبد خرید:</p>
              <p className="text-2xl font-extrabold text-charcoal mt-1 tabular-nums">
                {formatRial(cart.subtotalToman)}
              </p>
              <p className="text-sm font-semibold text-accent-dark mt-1">
                {tomanInWords(cart.subtotalToman)}
              </p>
            </div>
            <button
              onClick={submit}
              disabled={submitting}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-charcoal hover:bg-charcoal/90 text-white font-bold text-sm py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4.5 h-4.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {submitting ? 'در حال ثبت…' : 'ثبت فاکتور'}
            </button>
          </div>
        </div>
      )}

      {modal && (
        <InvoiceProductModal
          mode={modal}
          previousPurchases={previousPurchases}
          onAdd={add}
          onClose={() => setModal(null)}
          adding={pending}
        />
      )}
    </div>
  );
}

function QtyStepper({
  value,
  max,
  disabled,
  onChange,
}: {
  value: number;
  max: number;
  disabled: boolean;
  onChange: (q: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-charcoal hover:bg-silver-light disabled:opacity-40 transition-colors"
        aria-label="کاهش"
      >
        −
      </button>
      <span className="w-9 text-center font-semibold tabular-nums">
        {value.toLocaleString('fa-IR')}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-charcoal hover:bg-silver-light disabled:opacity-40 transition-colors"
        aria-label="افزایش"
      >
        +
      </button>
    </div>
  );
}
