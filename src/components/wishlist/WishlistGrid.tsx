'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { ProductVM } from '@/src/lib/serializers';
import ProductCard from '@/src/components/ui/ProductCard';
import { useListsUI, ensureListsHydrated } from '@/src/store/lists-ui';
import { getWishlist } from '@/actions/lists';

interface Props {
  initial: ProductVM[];
}

export default function WishlistGrid({ initial }: Props) {
  const [products, setProducts] = useState(initial);

  // Ref so the sync effect can read the current list without being a dependency
  // (adding `products` to deps would cause unnecessary re-runs on every filter).
  const productsRef = useRef(products);
  productsRef.current = products;

  const wishlist  = useListsUI((s) => s.wishlist);
  const hydrated  = useListsUI((s) => s.hydrated);

  useEffect(() => { ensureListsHydrated(); }, []);

  useEffect(() => {
    if (!hydrated) return;

    // If the store holds IDs not present in the current display list (e.g. the
    // user added an item from another page and the router cache served a stale
    // shell), we have full product data on the server but not client-side.
    // Re-fetch the full list so the new cards appear without a manual F5.
    const currentIds = new Set(productsRef.current.map((p) => p.id));
    const hasNew = [...wishlist].some((id) => !currentIds.has(id));

    if (hasNew) {
      getWishlist().then(setProducts).catch(() => {});
    } else {
      // All additions are accounted for — just drop any cards the user removed.
      setProducts((prev) => prev.filter((p) => wishlist.has(p.id)));
    }
  }, [wishlist, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-charcoal mb-2">لیست علاقه‌مندی‌ها خالی است</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs leading-6">
          روی آیکون قلب در کنار هر محصول کلیک کنید تا به علاقه‌مندی‌ها اضافه شود.
        </p>
        <Link
          href="/products"
          className="bg-accent hover:bg-accent-dark text-charcoal font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} variant="grid" />
      ))}
    </div>
  );
}
