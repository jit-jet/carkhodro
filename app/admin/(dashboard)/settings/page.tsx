import { Suspense } from "react";
import type { Metadata } from "next";
import { getSiteSettings } from "@/actions/admin-settings";
import { PageHeader } from "@/src/components/admin/AdminUI";
import SettingsForm from "@/src/components/admin/SettingsForm";

export const metadata: Metadata = { title: "تنظیمات سایت | پنل مدیریت" };

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader title="تنظیمات سایت" description="اطلاعات تماس، آدرس و شبکه‌های اجتماعی که در فروشگاه نمایش داده می‌شود" />
      <Suspense fallback={<SettingsSkeleton />}>
        <AdminSettingsContent />
      </Suspense>
    </div>
  );
}

async function AdminSettingsContent() {
  const settings = await getSiteSettings();
  return <SettingsForm initial={settings} />;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-56 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
