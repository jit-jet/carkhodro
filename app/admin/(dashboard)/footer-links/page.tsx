import type { Metadata } from "next";
import { getAllFooterLinks } from "@/actions/footer-links";
import { PageHeader } from "@/src/components/admin/AdminUI";
import FooterLinksManager from "@/src/components/admin/FooterLinksManager";

export const metadata: Metadata = { title: "لینک‌های فوتر | پنل مدیریت" };

export default async function AdminFooterLinksPage() {
  const [quickLinks, categoryLinks] = await Promise.all([
    getAllFooterLinks("QUICK"),
    getAllFooterLinks("CATEGORY"),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="لینک‌های فوتر"
        description="مدیریت ستون‌های «لینک‌های سریع» و «دسته‌بندی‌ها» در فوتر — لینک‌ها را بدون آدرس اصلی سایت و با / در اول بنویسید."
      />
      <FooterLinksManager
        group="QUICK"
        title="لینک‌های سریع"
        description="ستون اول لینک‌ها در فوتر سایت"
        initialLinks={quickLinks}
      />
      <FooterLinksManager
        group="CATEGORY"
        title="دسته‌بندی‌ها"
        description="ستون دسته‌بندی‌ها در فوتر سایت"
        initialLinks={categoryLinks}
      />
    </div>
  );
}
