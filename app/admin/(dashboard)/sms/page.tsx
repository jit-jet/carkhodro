import { Suspense } from "react";
import type { Metadata } from "next";
import { getSmsCampaigns } from "@/actions/admin-sms";
import { PageHeader } from "@/src/components/admin/AdminUI";
import SmsPanel from "@/src/components/admin/SmsPanel";

export const metadata: Metadata = { title: "پیامک گروهی | پنل مدیریت" };

export default function AdminSmsPage() {
  return (
    <div>
      <PageHeader title="پیامک گروهی" description="ارسال پیامک تبلیغاتی به همکاران، مشتریان تک‌فروش یا هر دو گروه" />
      <Suspense fallback={<SmsSkeleton />}>
        <AdminSmsContent />
      </Suspense>
    </div>
  );
}

async function AdminSmsContent() {
  const history = await getSmsCampaigns();
  return <SmsPanel initialHistory={history} />;
}

function SmsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-72 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
