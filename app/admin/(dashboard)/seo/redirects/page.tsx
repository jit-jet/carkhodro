import { getSeoRedirects } from "@/actions/admin-seo";
import RedirectManager from "@/src/components/admin/RedirectManager";
import { PageHeader } from "@/src/components/admin/AdminUI";
export default async function RedirectsPage() { return <div><PageHeader title="مدیریت ریدایرکت" description="ایجاد، ویرایش و حذف ریدایرکت‌های ۳۰۱ و ۳۰۲" /><RedirectManager initial={await getSeoRedirects()} /></div>; }
