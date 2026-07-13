'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductVM as Product } from '@/src/lib/serializers';
import { resolveOrderQtyUI } from '@/src/lib/order-quantity';
import { addToCart } from '@/actions/cart';
import { handleAddToCartResult, notifyStockLimit, useCartUI } from '@/src/store/cart-ui';
import WishlistButton from '@/src/components/product/WishlistButton';
import CompareButton from '@/src/components/product/CompareButton';

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

function formatPrice(price: number) {
  return price.toLocaleString('fa-IR') + ' تومان';
}

export default function ProductCard({ product, variant = 'slider' }: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const [phone, setPhone]           = useState('');
  const [notifyState, setNotifyState] = useState<'idle' | 'success' | 'error'>('idle');
  const [added, setAdded]           = useState(false);
  const [pending, startTransition]  = useTransition();
  const notify = useCartUI((s) => s.notify);

  const isGrid  = variant === 'grid';
  const { inStock, stockCapped, maxQty } = resolveOrderQtyUI(product);
  const flag    = ORIGIN_FLAGS[product.origin] ?? '🏭';

  const isNew = product.isNew;

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

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    if (isNaN(v)) return;
    if (stockCapped && maxQty != null && v > maxQty) {
      notifyStockLimit(maxQty);
      setQty(maxQty);
      return;
    }
    setQty(Math.max(1, v));
  }

  // Add to cart works for guests and signed-in users alike (the server action
  // resolves the actor). On success we fire the global "added" toast (product
  // name + quantity) and refresh the header badge count.
  function handleAddToCart() {
    startTransition(async () => {
      const res = await addToCart(product.id, qty);
      if (res.ok) {
        handleAddToCartResult(product.name, qty, res.data);
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      } else {
        notify({ variant: 'error', title: 'خطا', description: res.error });
      }
    });
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
      <div className={`relative ${isGrid ? 'h-48' : 'h-40'}`}>
        <Link href={`/products/${product.id}`} className="block w-full h-full bg-white overflow-hidden">
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
        </Link>

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
        <Link href={`/products/${product.id}`} className="flex-1 mb-2">
          <h3 className="text-sm font-semibold text-charcoal hover:text-accent-dark leading-5 line-clamp-2 transition-colors">
            {product.name}
          </h3>
        </Link>

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

        {/* Wishlist + Compare */}
        <div className="flex items-center gap-2 mb-3">
          <WishlistButton productId={product.id} productName={product.name} variant="compact" />
          <CompareButton productId={product.id} productName={product.name} variant="compact" />
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
                {...(stockCapped && maxQty != null ? { max: maxQty } : {})}
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
                disabled={stockCapped && maxQty != null && qty >= maxQty}
                className="px-3 py-1.5 text-charcoal font-bold text-base leading-none hover:bg-silver-light disabled:opacity-30 transition-colors"
                aria-label="افزایش تعداد"
              >
                +
              </button>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={pending}
              className={[
                'w-full active:scale-95 font-semibold text-sm py-2 rounded-xl transition-all duration-150 disabled:opacity-60',
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-accent hover:bg-accent-dark text-charcoal',
              ].join(' ')}
            >
              {pending ? 'در حال افزودن…' : added ? '✓ اضافه شد' : 'افزودن به سبد'}
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
