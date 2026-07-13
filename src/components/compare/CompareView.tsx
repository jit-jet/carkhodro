'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { removeFromCompare, getCompareList } from '@/actions/lists';
import { addToCart } from '@/actions/cart';
import { useListsUI, ensureListsHydrated } from '@/src/store/lists-ui';
import { useCartUI, handleAddToCartResult } from '@/src/store/cart-ui';
import type { ProductVM } from '@/src/lib/serializers';

const ORIGIN_FLAGS: Record<string, string> = {
  'آلمان': '🇩🇪', 'ژاپن': '🇯🇵', 'ایران': '🇮🇷',
  'کره': '🇰🇷', 'فرانسه': '🇫🇷', 'چین': '🇨🇳',
};

function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان';
}

function StarBar({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= Math.round(rating) ? '#F4C232' : '#E5E7EB'}
          />
        </svg>
      ))}
      <span className="text-xs text-gray-600 mr-1">{rating.toFixed(1)}</span>
    </span>
  );
}

function AddToCartCell({ product }: { product: ProductVM }) {
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const notify = useCartUI((s) => s.notify);

  if (product.stock <= 0) {
    return <span className="text-xs font-medium text-red-500">ناموجود</span>;
  }

  function handleAdd() {
    setBusy(true);
    addToCart(product.id, 1).then((res) => {
      setBusy(false);
      if (res.ok) {
        handleAddToCartResult(product.name, 1, res.data);
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      } else {
        notify({ variant: 'error', title: 'خطا', description: res.error });
      }
    });
  }

  return (
    <button
      onClick={handleAdd}
      disabled={busy}
      className={[
        'w-full text-xs font-semibold py-2.5 px-3 rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-60',
        added ? 'bg-green-500 text-white' : 'bg-accent hover:bg-accent-dark text-charcoal',
      ].join(' ')}
    >
      {busy ? 'در حال افزودن…' : added ? '✓ اضافه شد' : 'افزودن به سبد'}
    </button>
  );
}

interface Props {
  initial: ProductVM[];
  loggedIn: boolean;
}

function EmptyState({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-charcoal mb-2">{title}</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs leading-6">{body}</p>
      {cta}
    </div>
  );
}

const compareIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
    <path d="M9 3v18M15 3v18" />
    <path d="M9 7l-4 4 4 4M15 7l4 4-4 4" />
  </svg>
);

export default function CompareView({ initial, loggedIn }: Props) {
  const [products, setProducts] = useState(initial);
  const [removing, setRemoving] = useState<string | null>(null);

  const productsRef = useRef(products);
  productsRef.current = products;

  const compare   = useListsUI((s) => s.compare);
  const hydrated  = useListsUI((s) => s.hydrated);
  const setCompare = useListsUI((s) => s.setCompare);
  const notify = useCartUI((s) => s.notify);

  useEffect(() => { ensureListsHydrated(); }, []);

  // Re-fetch full product data when the store contains IDs not yet displayed
  // (happens when the user added items from another page and the rendered shell
  // is stale). Removals are handled synchronously by handleRemove below.
  useEffect(() => {
    if (!hydrated) return;
    const currentIds = new Set(productsRef.current.map((p) => p.id));
    const hasNew = [...compare].some((id) => !currentIds.has(id));
    if (hasNew) {
      getCompareList().then(setProducts).catch(() => {});
    }
  }, [compare, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRemove(productId: string) {
    setRemoving(productId);
    removeFromCompare(productId).then((res) => {
      setRemoving(null);
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setCompare(productId, false);
      } else {
        notify({ variant: 'error', title: 'خطا', description: res.error });
      }
    });
  }

  if (!loggedIn) {
    return (
      <EmptyState
        icon={compareIcon}
        title="برای استفاده از مقایسه وارد شوید"
        body="محصولات را با یکدیگر مقایسه کنید تا بهترین انتخاب را داشته باشید."
        cta={
          <Link
            href="/login?redirect=/compare"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            ورود به حساب کاربری
          </Link>
        }
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={compareIcon}
        title="لیست مقایسه خالی است"
        body="روی دکمه مقایسه در کنار هر محصول کلیک کنید تا به لیست مقایسه اضافه شود."
        cta={
          <Link
            href="/products"
            className="bg-accent hover:bg-accent-dark text-charcoal font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            مشاهده محصولات
          </Link>
        }
      />
    );
  }

  const minPrice = Math.min(...products.map((p) => p.price));

  // Attribute rows — defined here so minPrice/products are in scope
  const ROWS: Array<{ key: string; label: string; cell: (p: ProductVM) => React.ReactNode }> = [
    {
      key: 'price',
      label: 'قیمت',
      cell: (p) => (
        <div className="py-3 px-4 space-y-1">
          {p.oldPrice && (
            <p className="text-xs text-gray-400 line-through">{formatPrice(p.oldPrice)}</p>
          )}
          <p className={['text-sm font-bold',
            p.price === minPrice && products.length > 1 ? 'text-green-600' : 'text-accent-dark',
          ].join(' ')}>
            {formatPrice(p.price)}
          </p>
          <div className="flex flex-wrap gap-1">
            {p.discount ? (
              <span className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded-full">
                {p.discount}٪ تخفیف
              </span>
            ) : null}
            {p.price === minPrice && products.length > 1 ? (
              <span className="text-[10px] bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5 rounded-full">
                بهترین قیمت ✓
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'brand',
      label: 'برند',
      cell: (p) => <div className="py-3 px-4 text-sm text-charcoal">{p.brand}</div>,
    },
    {
      key: 'carType',
      label: 'نام ماشین',
      cell: (p) => <div className="py-3 px-4 text-sm text-charcoal">{p.carType}</div>,
    },
    {
      key: 'origin',
      label: 'کشور سازنده',
      cell: (p) => (
        <div className="py-3 px-4 text-sm text-charcoal">
          {ORIGIN_FLAGS[p.origin] ?? '🏭'} {p.origin}
        </div>
      ),
    },
    {
      key: 'warranty',
      label: 'گارانتی',
      cell: (p) => <div className="py-3 px-4 text-sm text-charcoal">{p.warranty}</div>,
    },
    {
      key: 'stock',
      label: 'موجودی',
      cell: (p) => (
        <div className="py-3 px-4">
          {p.stock > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2 py-1 rounded-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              موجود ({p.stock.toLocaleString('fa-IR')} عدد)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              ناموجود
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'امتیاز',
      cell: (p) => (
        <div className="py-3 px-4 space-y-1">
          <StarBar rating={p.rating} />
          <p className="text-xs text-gray-400">
            {p.reviewCount.toLocaleString('fa-IR')} نظر
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'دسته‌بندی',
      cell: (p) => <div className="py-3 px-4 text-sm text-charcoal">{p.categoryLabel}</div>,
    },
  ];

  const colCount = products.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {products.length < 4 && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 text-sm text-blue-700 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          می‌توانید تا {(4).toLocaleString('fa-IR')} محصول را با هم مقایسه کنید.{' '}
          <Link href="/products" className="font-semibold underline underline-offset-2 hover:text-blue-900 transition-colors">
            افزودن محصول
          </Link>
        </div>
      )}

      <div className="overflow-x-auto" dir="rtl">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: `${160 + colCount * 210}px` }}
        >
          {/* ── Product header row ── */}
          <thead>
            <tr className="bg-white border-b border-gray-200">
              {/* Sticky label header */}
              <th
                scope="col"
                className="sticky start-0 z-20 w-40 min-w-[160px] bg-gray-50 border-e border-gray-200 py-4 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                ویژگی
              </th>
              {/* Product columns */}
              {products.map((p) => (
                <th key={p.id} scope="col" className="border-s border-gray-100 bg-white p-4 min-w-[210px] align-top">
                  <div className="relative flex flex-col items-center gap-3 pt-1">
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(p.id)}
                      disabled={removing === p.id}
                      aria-label="حذف از مقایسه"
                      title="حذف از مقایسه"
                      className="absolute top-0 start-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      {removing === p.id ? (
                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                    </button>
                    {/* Product image */}
                    <Link href={`/products/${p.id}`} className="relative block w-24 h-24 shrink-0">
                      <Image
                        src={p.mainImage}
                        alt={p.name}
                        fill
                        sizes="96px"
                        className="object-contain"
                      />
                    </Link>
                    {/* Product name */}
                    <Link href={`/products/${p.id}`}>
                      <p className="text-xs font-semibold text-charcoal hover:text-accent-dark leading-5 line-clamp-2 text-center transition-colors">
                        {p.name}
                      </p>
                    </Link>
                    {/* SKU */}
                    <span className="text-[10px] font-mono text-gray-400 select-all">
                      {p.sku}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Attribute rows ── */}
          <tbody>
            {ROWS.map((row, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? 'bg-gray-50' : 'bg-white';
              return (
                <tr key={row.key} className={rowBg}>
                  {/* Sticky label */}
                  <td className={[
                    'sticky start-0 z-10 w-40 min-w-[160px] border-e border-gray-200 py-0 px-4 font-medium text-gray-600 text-xs leading-5 align-middle',
                    rowBg,
                  ].join(' ')}>
                    {row.label}
                  </td>
                  {/* Value cells */}
                  {products.map((p) => (
                    <td key={p.id} className="border-s border-gray-100 align-middle">
                      {row.cell(p)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>

          {/* ── Add to cart footer ── */}
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="sticky start-0 z-10 bg-gray-50 border-e border-gray-200 py-4 px-4 text-xs font-medium text-gray-600">
                افزودن به سبد
              </td>
              {products.map((p) => (
                <td key={p.id} className="border-s border-gray-100 p-4">
                  <AddToCartCell product={p} />
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
