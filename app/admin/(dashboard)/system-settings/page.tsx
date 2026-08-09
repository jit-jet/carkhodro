import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSystemSettings } from '@/actions/admin-system-settings';
import { PageHeader } from '@/src/components/admin/AdminUI';
import SystemSettingsForm from '@/src/components/admin/SystemSettingsForm';

export const metadata: Metadata = { title: 'تنظیمات سیستم | پنل مدیریت' };

export default async function SystemSettingsPage() {
  const settings = await getSystemSettings();
  if (!settings) redirect('/admin');
  return (
    <div>
      <PageHeader
        title="تنظیمات سیستم"
        description="مدیریت امن سرویس‌های خارجی و اطلاعات ورود مدیر ارشد"
      />
      <SystemSettingsForm initial={settings} />
    </div>
  );
}
