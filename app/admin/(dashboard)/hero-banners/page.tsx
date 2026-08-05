import type { Metadata } from "next";
import { getAllHeroBanners, getHeroContent } from "@/actions/hero-banners";
import { PageHeader } from "@/src/components/admin/AdminUI";
import HeroBannersManager from "@/src/components/admin/HeroBannersManager";

export const metadata: Metadata = { title: "بنرهای صفحه اصلی | پنل مدیریت" };

export default async function AdminHeroBannersPage() {
  const [content, banners] = await Promise.all([getHeroContent(), getAllHeroBanners()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="بنرهای صفحه اصلی"
        description="متن و دکمه‌های ثابت هیرو، به‌همراه تصاویر اسلایدر"
      />
      <HeroBannersManager initialContent={content} initialBanners={banners} />
    </div>
  );
}
