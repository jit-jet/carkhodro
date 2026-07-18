import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/src/lib/session';
import { getCompareList } from '@/actions/lists';
import CompareView from '@/src/components/compare/CompareView';

export const metadata: Metadata = {
  title: 'مقایسه محصولات | کارخودرو',
};

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <CompareContent />
    </Suspense>
  );
}

async function CompareContent() {
  const [user, products] = await Promise.all([
    getCurrentUser(),
    getCompareList(),
  ]);

  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-3 flex-wrap">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">مقایسه محصولات</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M9 3v18M15 3v18" />
                <path d="M9 7l-4 4 4 4M15 7l4 4-4 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-charcoal">مقایسه محصولات</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {products.length.toLocaleString('fa-IR')} از {(4).toLocaleString('fa-IR')} محصول
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <CompareView initial={products} loggedIn={!!user} />
      </div>
    </div>
  );
}

function CompareSkeleton() {
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100 h-24 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
        <div className="h-[480px] bg-white rounded-2xl border border-gray-100" />
      </div>
    </div>
  );
}
