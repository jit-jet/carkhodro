/**
 * Pre-orders / backorders — «پیش‌خریدها».
 * The partner's requests placed against out-of-stock parts. Streams in <Suspense>.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getBackorders } from '@/actions/backorders';
import BackordersList from '@/src/components/dashboard/BackordersList';

export const metadata: Metadata = {
  title: 'پیش‌خریدها | پنل کاربری کارخودرو',
};

export default function BackordersPage() {
  return (
    <Suspense fallback={<BackordersSkeleton />}>
      <BackordersContent />
    </Suspense>
  );
}

async function BackordersContent() {
  const items = await getBackorders();
  return <BackordersList initial={items} />;
}

function BackordersSkeleton() {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-80 animate-pulse" />;
}
