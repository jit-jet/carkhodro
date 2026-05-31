'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/src/data/plpMockData';

interface ProductCardProps {
  product: Product;
  /** slider = fixed narrow width for horizontal scroll; grid = full width for PLP grid */
  variant?: 'slider' | 'grid';
}

const ORIGIN_FLAGS: Record<string, string> = {
  'آلمان':   '🇩🇪',
  'ژاپن':   '🇯🇵',
  'ایران':   '🇮🇷',
  'کره':    '🇰🇷',
  'فرانسه': '🇫🇷',
  'چین':    '🇨🇳',
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function formatPrice(price: number) {
  return price.toLocaleString('fa-IR') + ' تومان';
}

export default function ProductCard({ product, variant = 'slider' }: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const [phone, setPhone]           = useState('');
  const [notifyState, setNotifyState] = useState<'idle' | 'success' | 'error'>('idle');

  const isGrid  = variant === 'grid';
  const inStock = product.stock > 0;
  const flag    = ORIGIN_FLAGS[product.origin] ?? '🏭';
  const maxQty  = inStock ? product.stock : 0;

  // "جدید" badge shown for products added within the last 3 days
  const isNew = Date.now() - new Date(product.createdDate).getTime() <= THREE_DAYS_MS;

  function changeQty(delta: number) {
    setQty(q => Math.min(maxQty, Math.max(1, q + delta)));
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) setQty(Math.min(maxQty, Math.max(1, v)));
  }

  function handleNotify() {
    const cleaned = phone.replace(/\s|-/g, '');
    if (/^09\d{9}$/.test(cleaned)) {
      setNotifyState('success');
    } else {
      setNotifyState('error');
    }
  }

  return (
    <div
      className={[
        'bg-white rounded-2xl border border-gray-100 shadow-sm',
        'hover:shadow-xl hover:-translate-y-1 transition-all duration-200',
        'overflow-hidden group flex flex-col',
        isGrid ? 'w-full' : 'w-56 sm:w-60 shrink-0',
      ].join(' ')}
    >
      {/* ── Product image ──────────────────────────────────── */}
      <div className={`relative bg-white overflow-hidden ${isGrid ? 'h-48' : 'h-40'}`}>
        <Image
          src={product.mainImage}
          alt={product.name}
          fill
          sizes={isGrid
            ? '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw'
            : '240px'}
          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
        />

        {/* Discount / New badge — end side (left in RTL) */}
        {product.discount ? (
          <span className="absolute top-2 inset-e-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
            {product.discount}٪ تخفیف
          </span>
        ) : isNew ? (
          <span className="absolute top-2 inset-e-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
            جدید
          </span>
        ) : null}

        {/* Warranty badge — start side (right in RTL) */}
        <span className="absolute top-2 inset-s-2 bg-blue-600/85 text-white text-xs font-medium px-2 py-0.5 rounded-full shadow backdrop-blur-sm">
          {product.warranty} گارانتی
        </span>
      </div>

      {/* ── SKU code ───────────────────────────────────────── */}
      <div className="px-3 pt-2">
        <span className="text-[10px] font-mono text-gray-400 tracking-wider select-all">
          کد: {product.sku}
        </span>
      </div>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="px-3 pb-3 pt-1.5 flex flex-col flex-1">
        {/* Brand • Car type */}
        <p className="text-xs text-gray-400 mb-1">
          {product.brand} • {product.carType}
        </p>

        {/* Product name */}
        <h3 className="text-sm font-semibold text-charcoal leading-5 line-clamp-2 flex-1 mb-2">
          {product.name}
        </h3>

        {/* Origin + Stock */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-xs text-gray-500">
            {flag} {product.origin}
          </span>
          <span className={`text-xs font-medium ${inStock ? 'text-green-600' : 'text-red-500'}`}>
            {inStock ? `موجود: ${product.stock.toLocaleString('fa-IR')} عدد` : 'ناموجود'}
          </span>
        </div>

        {/* Price */}
        <div className="mb-3">
          {product.oldPrice && (
            <p className="text-xs text-gray-400 line-through mb-0.5">
              {formatPrice(product.oldPrice)}
            </p>
          )}
          <p className="text-base font-bold text-accent-dark leading-none">
            {formatPrice(product.price)}
          </p>
        </div>

        {inStock ? (
          <>
            {/* Quantity stepper */}
            <div dir="ltr" className="flex items-center border border-gray-200 rounded-xl overflow-hidden mb-2">
              <button
                onClick={() => changeQty(-1)}
                disabled={qty <= 1}
                className="px-3 py-1.5 text-charcoal font-bold text-base leading-none hover:bg-silver-light disabled:opacity-30 transition-colors"
                aria-label="کاهش تعداد"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={qty}
                onChange={handleInput}
                className="w-0 flex-1 text-center text-sm font-semibold text-charcoal bg-transparent focus:outline-none
                           [appearance:textfield]
                           [&::-webkit-outer-spin-button]:appearance-none
                           [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="تعداد"
              />
              <button
                onClick={() => changeQty(1)}
                disabled={qty >= maxQty}
                className="px-3 py-1.5 text-charcoal font-bold text-base leading-none hover:bg-silver-light disabled:opacity-30 transition-colors"
                aria-label="افزایش تعداد"
              >
                +
              </button>
            </div>

            {/* Add to cart */}
            <button className="w-full bg-accent hover:bg-accent-dark active:scale-95 text-charcoal font-semibold text-sm py-2 rounded-xl transition-all duration-150">
              افزودن به سبد
            </button>
          </>
        ) : (
          <>
            {/* Out-of-stock: notify me */}
            {notifyState === 'success' ? (
              <div className="flex items-center justify-center gap-2 bg-green-50 text-green-600 text-xs font-semibold rounded-xl px-3 py-3">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                شماره شما ثبت شد، خبرتان می‌دهیم
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-1.5">وقتی موجود شد به شما خبر می‌دهیم:</p>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setNotifyState('idle'); }}
                  placeholder="09xxxxxxxxx"
                  className={`w-full border rounded-xl px-3 py-2 text-sm text-center tracking-wider focus:outline-none transition-colors mb-1.5 ${
                    notifyState === 'error'
                      ? 'border-red-400 bg-red-50 placeholder-red-300'
                      : 'border-gray-200 focus:border-accent'
                  }`}
                />
                {notifyState === 'error' && (
                  <p className="text-xs text-red-500 mb-1.5">شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)</p>
                )}
                <button
                  onClick={handleNotify}
                  className="w-full bg-charcoal hover:bg-gray-800 active:scale-95 text-white font-semibold text-xs py-2.5 rounded-xl transition-all duration-150"
                >
                  موجود شد خبرم کن
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
