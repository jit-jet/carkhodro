import type { Metadata } from 'next';
import { getMobileNavItems } from '@/actions/mobile-nav';
import { PageHeader } from '@/src/components/admin/AdminUI';
import MobileNavManager from '@/src/components/admin/MobileNavManager';

export const metadata: Metadata = { title: 'منوی پایین موبایل | پنل مدیریت' };

export default async function MobileNavAdminPage() {
  const items = await getMobileNavItems();
  return (
    <div className="space-y-6">
      <PageHeader title="منوی پایین موبایل" description="آیکون، عنوان و لینک‌های نوار ثابت پایین صفحات عمومی سایت را مدیریت کنید." />
      <MobileNavManager initialItems={items} />
    </div>
  );
}
