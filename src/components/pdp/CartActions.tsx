'use client';

import { useState, useTransition } from 'react';
import { addToCart } from '@/actions/cart';
import { handleAddToCartResult, notifyStockLimit, useCartUI } from '@/src/store/cart-ui';
import { resolveOrderQtyUI } from '@/src/lib/order-quantity';
import type { PDPProductVM } from '@/src/lib/serializers';

interface Props {
  product: Pick<PDPProductVM, 'id' | 'stock' | 'name' | 'orderQuantityCap'>;
}

function ShoppingBagIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export default function CartActions({ product }: Props) {
  const { inStock, stockCapped, maxQty } = resolveOrderQtyUI(product);

  const [qty,         setQty]         = useState(1);
  const [added,       setAdded]       = useState(false);
  const [phone,       setPhone]       = useState('');
  const [notifyState, setNotifyState] = useState<'idle' | 'success' | 'error'>('idle');
  const [pending, startTransition]    = useTransition();
  const notify = useCartUI((s) => s.notify);

  function changeQty(delta: number) {
    setQty((q) => {
      const next = q + delta;
      if (stockCapped && maxQty != null && next > maxQty) {
        notifyStockLimit(maxQty);
        return q;
      }
      return Math.max(1, next);
    });
  }

  function handleQtyInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    if (isNaN(v)) return;
    if (stockCapped && maxQty != null && v > maxQty) {
      notifyStockLimit(maxQty);
      setQty(maxQty);
      return;
    }
    setQty(Math.max(1, v));
  }

  function handleAddToCart() {
    startTransition(async () => {
      const res = await addToCart(product.id, qty);
      if (res.ok) {
        handleAddToCartResult(product.name, qty, res.data);
        setAdded(true);
        setTimeout(() => setAdded(false), 2200);
      } else {
        notify({ variant: 'error', title: 'خطا', description: res.error });
      }
    });
  }

  function handleNotify() {
    const cleaned = phone.replace(/[\s\-]/g, '');
    if (/^09\d{9}$/.test(cleaned)) {
      setNotifyState('success');
    } else {
      setNotifyState('error');
    }
  }

  if (!inStock) {
    return (
      <div className="space-y-3">
        {/* Out-of-stock badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-600 text-sm font-semibold px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            ناموجود
          </span>
          <p className="text-sm text-gray-500">این محصول در حال حاضر موجود نیست.</p>
        </div>

        {notifyState === 'success' ? (
          <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold text-sm rounded-xl px-4 py-3.5 border border-green-200">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            شماره شما ثبت شد — به محض موجود شدن خبرتان می‌دهیم
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">شماره موبایل خود را وارد کنید تا موجود شد خبرتان دهیم:</p>
            <div className="flex gap-2">
              <input
                type="tel"
                dir="ltr"
                value={phone}
                placeholder="09xxxxxxxxx"
                onChange={e => { setPhone(e.target.value); setNotifyState('idle'); }}
                className={[
                  'flex-1 border rounded-xl px-4 py-3 text-sm text-center tracking-widest focus:outline-none transition-colors',
                  notifyState === 'error'
                    ? 'border-red-400 bg-red-50 placeholder-red-300'
                    : 'border-gray-200 focus:border-accent',
                ].join(' ')}
              />
              <button
                onClick={handleNotify}
                className="flex items-center gap-2 bg-charcoal hover:bg-gray-800 active:scale-95 text-white font-semibold text-sm px-4 py-3 rounded-xl transition-all duration-150 whitespace-nowrap"
              >
                <BellIcon />
                موجود شد خبرم کن
              </button>
            </div>
            {notifyState === 'error' && (
              <p className="text-xs text-red-500">شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stock indicator */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          موجود در انبار
        </span>
        <span className="text-sm text-gray-500">
          {product.stock.toLocaleString('fa-IR')} عدد باقی‌مانده
        </span>
      </div>

      {/* Qty + Add to cart row */}
      <div className="flex gap-3">
        {/* Quantity stepper */}
        <div dir="ltr" className="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
          <button
            onClick={() => changeQty(-1)}
            disabled={qty <= 1}
            className="px-3.5 py-3 text-charcoal font-bold text-lg leading-none hover:bg-silver-light disabled:opacity-30 transition-colors"
            aria-label="کاهش تعداد"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            {...(stockCapped && maxQty != null ? { max: maxQty } : {})}
            value={qty}
            onChange={handleQtyInput}
            className="w-12 text-center text-base font-bold text-charcoal bg-transparent focus:outline-none
                       [appearance:textfield]
                       [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="تعداد"
          />
          <button
            onClick={() => changeQty(1)}
            disabled={stockCapped && maxQty != null && qty >= maxQty}
            className="px-3.5 py-3 text-charcoal font-bold text-lg leading-none hover:bg-silver-light disabled:opacity-30 transition-colors"
            aria-label="افزایش تعداد"
          >
            +
          </button>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={pending}
          className={[
            'flex-1 flex items-center justify-center gap-2 font-bold text-base py-3 rounded-xl transition-all duration-200 disabled:opacity-60',
            added
              ? 'bg-green-500 text-white scale-95'
              : 'bg-accent hover:bg-accent-dark active:scale-95 text-charcoal',
          ].join(' ')}
        >
          {pending ? (
            'در حال افزودن…'
          ) : added ? (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              اضافه شد
            </>
          ) : (
            <>
              <ShoppingBagIcon />
              افزودن به سبد خرید
            </>
          )}
        </button>
      </div>
    </div>
  );
}
