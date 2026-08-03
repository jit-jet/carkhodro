import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getHesabfaIntegrationStatus } from '@/actions/hesabfa';
import { PageHeader } from '@/src/components/admin/AdminUI';
import HesabfaPanel from '@/src/components/admin/HesabfaPanel';

export const metadata: Metadata = { title: 'حسابداری | پنل مدیریت' };

export default async function AdminAccountingPage() {
  // Request-time only — Hesabfa status uses live fetch and must not prerender.
  await connection();
  const status = await getHesabfaIntegrationStatus();

  return (
    <div>
      <PageHeader
        title="حسابداری (حسابفا)"
        description="تنظیمات اتصال، ثبت وب‌هوک و همگام‌سازی دوطرفه کالاها، اشخاص و فاکتورها با حسابفا"
      />
      <HesabfaPanel
        configured={status.configured}
        hookUrl={status.hookUrl}
        appWebhookUrl={status.appWebhookUrl}
      />
    </div>
  );
}
