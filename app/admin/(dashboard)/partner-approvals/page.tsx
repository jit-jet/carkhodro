import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import { prisma } from '@/src/lib/prisma';
import { PageHeader } from '@/src/components/admin/AdminUI';
import PartnerApprovals from '@/src/components/admin/PartnerApprovals';

export const metadata = { title: 'تایید همکاران | پنل مدیریت' };

export default function Page({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  return <Suspense fallback={<p>در حال بارگذاری…</p>}><Content searchParams={searchParams} /></Suspense>;
}

async function Content({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  if (!await getCurrentAdmin()) redirect('/admin/login');
  const { userId } = await searchParams;
  const users = await prisma.user.findMany({
    where: { role: 'WHOLESALE_PENDING' },
    select: { id: true, firstName: true, lastName: true, phoneNumber: true },
    orderBy: { createdAt: 'asc' },
  });
  return <div>
    <PageHeader title="تایید همکاران" description="درخواست‌های همکاری در انتظار تصمیم مدیریت" />
    <PartnerApprovals users={users} selectedId={userId} />
  </div>;
}
