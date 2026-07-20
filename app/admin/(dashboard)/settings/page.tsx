import { Suspense } from "react";
import type { Metadata } from "next";
import { getSiteSettings } from "@/actions/admin-settings";
import { getAllSocialLinks } from "@/actions/site-settings";
import { PageHeader } from "@/src/components/admin/AdminUI";
import SettingsForm from "@/src/components/admin/SettingsForm";

export const metadata: Metadata = { title: "تنظیمات سایت | پنل مدیریت" };

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader
        title="تنظیمات سایت"
        description="مدیریت اطلاعات هدر، فوتر، تماس و شبکه‌های اجتماعی فروشگاه"
      />
      <Suspense fallback={<SettingsSkeleton />}>
        <AdminSettingsContent />
      </Suspense>
    </div>
  );
}

async function AdminSettingsContent() {
  const [settings, socialLinks] = await Promise.all([
    getSiteSettings(),
    getAllSocialLinks(),
  ]);
  return <SettingsForm initial={settings} initialSocialLinks={socialLinks} />;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-56 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
