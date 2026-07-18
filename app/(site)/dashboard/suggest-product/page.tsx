/**
 * Product suggestions — درخواست تأمین کالا.
 * Wholesale-only: partners propose catalogue items for later admin review.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getMyProductSuggestions } from '@/actions/product-suggestions';
import ProductSuggestionForm from '@/src/components/dashboard/ProductSuggestionForm';
import { getCurrentUser } from '@/src/lib/session';
import { isWholesaleUser } from '@/src/lib/user-role';

export const metadata: Metadata = {
  title: 'درخواست تأمین کالا | پنل کاربری کارخودرو',
};

export default function SuggestProductPage() {
  return (
    <Suspense fallback={<SuggestSkeleton />}>
      <SuggestContent />
    </Suspense>
  );
}

async function SuggestContent() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/dashboard/suggest-product');
  if (!isWholesaleUser(user.role)) redirect('/dashboard');

  const suggestions = await getMyProductSuggestions();
  return <ProductSuggestionForm initial={suggestions} />;
}

function SuggestSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-72 animate-pulse" />
  );
}
