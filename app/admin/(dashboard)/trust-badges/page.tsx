import type { Metadata } from "next";
import { getSiteSettings } from "@/actions/admin-settings";
import { PageHeader } from "@/src/components/admin/AdminUI";
import TrustBadgesManager from "@/src/components/admin/TrustBadgesManager";

export const metadata: Metadata = { title: "نشان‌های اعتماد فوتر | پنل مدیریت" };

export default async function AdminTrustBadgesPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="نشان‌های اعتماد فوتر"
        description="چهار نشان اعتماد بالای فوتر سایت — آیکون، عنوان و توضیح کوتاه"
      />
      <TrustBadgesManager initialBadges={settings.footerTrustBadges} />
    </div>
  );
}
