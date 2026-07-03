/**
 * Favorites — «علاقه‌مندی‌ها».
 * The partner's saved products, reusing the storefront wishlist data + grid.
 * Per-user data streams inside <Suspense>.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getWishlist } from '@/actions/lists';
import { formatNumberFa } from '@/src/lib/format';
import WishlistGrid from '@/src/components/wishlist/WishlistGrid';

export const metadata: Metadata = {
  title: 'علاقه‌مندی‌ها | پنل همکاران اسکار',
};

export default function FavoritesPage() {
  return (
    <Suspense fallback={<FavoritesSkeleton />}>
      <FavoritesContent />
    </Suspense>
  );
}

async function FavoritesContent() {
  const products = await getWishlist();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-lg font-extrabold text-charcoal flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
          </svg>
          علاقه‌مندی‌های من
        </h1>
        <span className="text-sm text-gray-400">{formatNumberFa(products.length)} محصول</span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm mb-4">هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.</p>
          <Link
            href="/products"
            className="inline-block bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            مشاهده محصولات
          </Link>
        </div>
      ) : (
        <WishlistGrid initial={products} />
      )}
    </div>
  );
}

function FavoritesSkeleton() {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-96 animate-pulse" />;
}
