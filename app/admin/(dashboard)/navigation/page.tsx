import type { Metadata } from "next";
import { getAllNavLinks } from "@/actions/navigation";
import { PageHeader } from "@/src/components/admin/AdminUI";
import NavLinksManager from "@/src/components/admin/NavLinksManager";

export const metadata: Metadata = { title: "منوی سایت | پنل مدیریت" };

export default async function AdminNavigationPage() {
  const links = await getAllNavLinks();

  return (
    <div>
      <PageHeader
        title="منوی سایت"
        description="مدیریت لینک‌های منوی اصلی — افزودن، حذف و تغییر ترتیب نمایش ( لینک ها را بدون ادرس اصلی سایت و با / در اول لینک بنویسید. )"
      />
      <NavLinksManager initialLinks={links} />
    </div>
  );
}
