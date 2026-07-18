import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/src/lib/session';
import { getWishlist } from '@/actions/lists';
import WishlistGrid from '@/src/components/wishlist/WishlistGrid';

export const metadata: Metadata = {
  title: 'علاقه‌مندی‌ها | کارخودرو',
};

export default function WishlistPage() {
  return (
    <Suspense fallback={<WishlistSkeleton />}>
      <WishlistContent />
    </Suspense>
  );
}

async function WishlistContent() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/wishlist');

  const products = await getWishlist();

  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-3 flex-wrap">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">علاقه‌مندی‌ها</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-charcoal">علاقه‌مندی‌های من</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {products.length.toLocaleString('fa-IR')} محصول
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <WishlistGrid initial={products} />
      </div>
    </div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100 h-24 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 bg-white rounded-2xl border border-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
