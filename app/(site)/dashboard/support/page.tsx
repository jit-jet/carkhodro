/**
 * Support / messaging — «پشتیبانی».
 * Inbox / Sent / Deleted folders with an unread badge, a new-message composer
 * and read / delete / restore actions. Per-user data streams inside <Suspense>.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getSupportInbox } from '@/actions/support';
import SupportPanel from '@/src/components/dashboard/SupportPanel';

export const metadata: Metadata = {
  title: 'پشتیبانی | پنل کاربری کارخودرو',
};

export default function SupportPage() {
  return (
    <Suspense fallback={<SupportSkeleton />}>
      <SupportContent />
    </Suspense>
  );
}

async function SupportContent() {
  const inbox = await getSupportInbox();
  return <SupportPanel initial={inbox} />;
}

function SupportSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-96 animate-pulse" />
  );
}
