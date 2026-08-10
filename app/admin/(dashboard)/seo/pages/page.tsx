import type { Metadata } from 'next';
import { getStaticPagesSeo } from '@/actions/admin-static-page-seo';
import StaticPageSeoManager from '@/src/components/admin/StaticPageSeoManager';
import { PageHeader } from '@/src/components/admin/AdminUI';

export const metadata: Metadata = { title: 'سئوی صفحات ثابت | پنل مدیریت' };

export default async function StaticPagesSeoPage() {
  return (
    <div>
      <PageHeader
        title="سئوی صفحات ثابت"
        description="Canonical و عنوان و توضیحات Open Graph از مقادیر هر صفحه به‌صورت خودکار تولید می‌شوند."
      />
      <StaticPageSeoManager initial={await getStaticPagesSeo()} />
    </div>
  );
}
