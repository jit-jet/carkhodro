import type { Metadata } from "next";
import { getAllSocialLinks } from "@/actions/site-settings";
import { PageHeader } from "@/src/components/admin/AdminUI";
import SocialLinksManager from "@/src/components/admin/SocialLinksManager";

export const metadata: Metadata = { title: "شبکه‌های اجتماعی | پنل مدیریت" };

export default async function AdminSocialLinksPage() {
  const socialLinks = await getAllSocialLinks();

  return (
    <div className="space-y-6">
      <PageHeader
        title="شبکه‌های اجتماعی"
        description="لینک‌های شبکه‌های اجتماعی نمایش‌داده‌شده در فوتر و صفحه تماس با ما"
      />
      <SocialLinksManager initialLinks={socialLinks} />
    </div>
  );
}
