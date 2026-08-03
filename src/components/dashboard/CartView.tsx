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
import { previewDiscountCode } from '@/actions/discount-checkout';
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState('');

  const [couponDraft, setCouponDraft] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponPending, startCoupon] = useTransition();

  function clearCoupon() {
    setAppliedCode(null);
    setDiscountAmount(0);
    setCouponError('');
    setCouponDraft('');
  }

  function apply(next: DashboardCartVM) {
    setCart(next);
    setCount(next.totalItems);
    // Line totals changed — drop any applied coupon so amounts stay in sync.
    setAppliedCode(null);
    setDiscountAmount(0);
    setCouponError('');
  }

  function changeQty(id: string, nextQty: number) {
    const line = cart.lines.find((l) => l.id === id);
    if (!line) return;
    const qty = Math.max(1, nextQty);
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

  function applyCoupon() {
    setCouponError('');
    startCoupon(async () => {
      const result = await previewDiscountCode(couponDraft);
      if (!result.ok) {
        setAppliedCode(null);
        setDiscountAmount(0);
        setCouponError(result.error);
        return;
      }
      setAppliedCode(result.data.code);
      setDiscountAmount(result.data.discountAmount);
      setCouponError('');
    });
  }

  function submit() {
    setError('');
    startSubmit(async () => {
      const result = await submitInvoice({
        paymentTerms: terms,
        notes,
        discountCode: appliedCode ?? undefined,
      });
      if (result.ok) {
        setCount(0);
        router.push(`/dashboard/orders/${result.data.id}`);
      } else {
        setConfirmOpen(false);
        setError(result.error);
      }
    });
  }

  const empty = cart.lines.length === 0;
  const hasCallForPrice = cart.lines.some((l) => l.callForPrice);
  const payableToman = Math.max(0, cart.subtotalToman - discountAmount);

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
                        {line.callForPrice
                          ? 'تماس برای قیمت'
                          : formatNumberFa(line.unitPriceToman * 10)}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-500">
                        {line.callForPrice ? '—' : `٪${line.discountPct.toLocaleString('fa-IR')}`}
                      </td>
                      <td className="py-3 px-2">
                        {line.callForPrice ? (
                          <span className="text-xs text-amber-700">فقط تماس</span>
                        ) : (
                          <QtyStepper
                            value={line.quantity}
                            disabled={pending}
                            onChange={(q) => changeQty(line.id, q)}
                          />
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-bold whitespace-nowrap tabular-nums">
                        {line.callForPrice
                          ? '—'
                          : formatNumberFa(line.lineTotalToman * 10)}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Coupon + notes */}
          <div className="space-y-4 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-charcoal/70 shrink-0"
                  aria-hidden
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <h2 className="text-sm sm:text-base font-bold text-charcoal">کد تخفیف</h2>
              </div>

              {appliedCode ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-green-50 border border-green-100 px-3 py-3 sm:px-4">
                  <div className="min-w-0">
                    <p
                      className="text-sm sm:text-base font-bold text-green-800 tracking-wide break-all"
                      dir="ltr"
                    >
                      {appliedCode}
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">اعمال شد</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearCoupon}
                    className="self-end sm:self-auto text-xs font-semibold text-green-800 hover:text-red-600 shrink-0 px-2 py-1"
                  >
                    حذف
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={couponDraft}
                    onChange={(e) => setCouponDraft(e.target.value.toUpperCase())}
                    placeholder="وارد کردن کد"
                    dir="ltr"
                    className="w-full min-w-0 flex-1 rounded-xl border-2 border-silver focus:border-accent px-3 py-2.5 text-sm text-left tracking-wide placeholder:text-gray-400 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponPending || !couponDraft.trim()}
                    className="w-full sm:w-auto shrink-0 rounded-xl bg-charcoal text-white px-5 py-2.5 text-sm font-bold hover:bg-charcoal/90 disabled:opacity-50 transition-colors"
                  >
                    {couponPending ? 'در حال بررسی…' : 'اعمال'}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-600 mt-2" role="alert">
                  {couponError}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col">
            <div className="text-center mb-1 space-y-1">
              <p className="text-sm text-gray-400">جمع کل سبد خرید:</p>
              {discountAmount > 0 && (
                <>
                  <p className="text-base sm:text-lg font-bold text-charcoal tabular-nums">
                    {formatRial(cart.subtotalToman)}
                  </p>
                  <p className="text-sm font-semibold text-green-700 tabular-nums break-words px-1">
                    تخفیف{appliedCode ? ` (${appliedCode})` : ''}: −{' '}
                    {formatNumberFa(discountAmount * 10)} ریال
                  </p>
                </>
              )}
              <p className="text-xl sm:text-2xl font-extrabold text-charcoal mt-1 tabular-nums">
                {formatRial(payableToman)}
              </p>
              <p className="text-sm font-semibold text-accent-dark mt-1 leading-6 px-1">
                {tomanInWords(payableToman)}
              </p>
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={submitting || hasCallForPrice}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-charcoal hover:bg-charcoal/90 text-white font-bold text-sm py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4.5 h-4.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {submitting ? 'در حال ثبت…' : 'ثبت فاکتور'}
            </button>
            {hasCallForPrice && (
              <p className="text-xs text-amber-700 mt-2 text-center leading-5">
                لطفاً ردیف‌های «تماس برای قیمت» را از فاکتور حذف کنید.
              </p>
            )}
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

      {confirmOpen && (
        <ConfirmInvoiceModal
          cart={cart}
          notes={notes}
          discountAmount={discountAmount}
          discountCode={appliedCode}
          payableToman={payableToman}
          submitting={submitting}
          onConfirm={submit}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

function ConfirmInvoiceModal({
  cart,
  notes,
  discountAmount,
  discountCode,
  payableToman,
  submitting,
  onConfirm,
  onClose,
}: {
  cart: DashboardCartVM;
  notes: string;
  discountAmount: number;
  discountCode: string | null;
  payableToman: number;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const previewLines = cart.lines.slice(0, 5);
  const remaining = cart.lines.length - previewLines.length;
  const trimmedNotes = notes.trim();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={submitting ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="تأیید ثبت فاکتور"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-accent">
          <h2 className="font-bold text-charcoal">تأیید ثبت فاکتور</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="بستن"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/10 hover:bg-black/20 text-charcoal transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500 leading-6">
            لطفاً خلاصه فاکتور را بررسی کنید و در صورت صحت، ثبت را تأیید نمایید.
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-silver-light/60 px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-1">تعداد اقلام</p>
              <p className="font-bold text-charcoal tabular-nums">
                {cart.totalItems.toLocaleString('fa-IR')} عدد
              </p>
            </div>
            <div className="rounded-xl bg-silver-light/60 px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-1">تعداد ردیف</p>
              <p className="font-bold text-charcoal tabular-nums">
                {cart.lines.length.toLocaleString('fa-IR')} ردیف
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
              {previewLines.map((line) => (
                <li key={line.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
                  <div className="min-w-0 text-right">
                    <p className="font-semibold text-charcoal truncate">{line.name}</p>
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">{line.sku}</p>
                  </div>
                  <div className="shrink-0 text-left">
                    <p className="font-bold text-charcoal tabular-nums whitespace-nowrap">
                      {formatNumberFa(line.lineTotalToman * 10)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                      × {line.quantity.toLocaleString('fa-IR')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {remaining > 0 && (
              <p className="text-xs text-gray-400 text-center py-2 border-t border-gray-50">
                و {remaining.toLocaleString('fa-IR')} ردیف دیگر…
              </p>
            )}
          </div>

          {trimmedNotes && (
            <div className="rounded-xl bg-amber-50/70 border border-amber-100 px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-1">توضیحات</p>
              <p className="text-sm text-charcoal leading-6 whitespace-pre-wrap">{trimmedNotes}</p>
            </div>
          )}

          <div className="text-center pt-1 space-y-1">
            <p className="text-xs text-gray-400">جمع کل</p>
            <p className="text-base font-bold text-charcoal tabular-nums">
              {formatRial(cart.subtotalToman)}
            </p>
            {discountAmount > 0 && (
              <p className="text-sm font-semibold text-green-700 tabular-nums">
                تخفیف{discountCode ? ` (${discountCode})` : ''}: − {formatRial(discountAmount)}
              </p>
            )}
            <p className="text-xl font-extrabold text-charcoal mt-1 tabular-nums">
              {formatRial(payableToman)}
            </p>
            <p className="text-xs font-semibold text-accent-dark mt-1">
              {tomanInWords(payableToman)}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 text-sm font-semibold text-charcoal border-2 border-gray-200 hover:bg-gray-50 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              onClick={onConfirm}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-charcoal hover:bg-charcoal/90 text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting ? 'در حال ثبت…' : 'تأیید و ثبت فاکتور'}
            </button>
          </div>
        </div>
      </div>
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
  max?: number;
  disabled: boolean;
  onChange: (q: number) => void;
}) {
  const atMax = max != null && value >= max;
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
        disabled={disabled || atMax}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-charcoal hover:bg-silver-light disabled:opacity-40 transition-colors"
        aria-label="افزایش"
      >
        +
      </button>
    </div>
  );
}
