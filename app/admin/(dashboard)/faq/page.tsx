import type { Metadata } from "next";
import { getFaqs } from "@/actions/faq";
import { PageHeader } from "@/src/components/admin/AdminUI";
import FaqManager from "@/src/components/admin/FaqManager";

export const metadata: Metadata = { title: "سوالات متداول | پنل مدیریت" };

export default async function AdminFaqPage() {
  const faqs = await getFaqs();

  return (
    <div>
      <PageHeader title="سوالات متداول" description="مدیریت سوالات متداول نمایش‌داده‌شده در صفحه FAQ" />
      <FaqManager initialFaqs={faqs} />
    </div>
  );
}
