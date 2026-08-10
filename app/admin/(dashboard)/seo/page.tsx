import type { Metadata } from "next";
import { getSiteSettings } from "@/actions/admin-settings";
import GlobalSeoForm from "@/src/components/admin/GlobalSeoForm";
import { PageHeader } from "@/src/components/admin/AdminUI";

export const metadata: Metadata = { title: "سئوی عمومی | پنل مدیریت" };
export default async function GlobalSeoPage() {
  return <div><PageHeader title="سئوی عمومی" description="متادیتا، ابزارهای گوگل و تنظیمات پیش‌فرض سئو" /><GlobalSeoForm initial={await getSiteSettings()} /></div>;
}
