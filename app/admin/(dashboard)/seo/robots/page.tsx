import { getSiteSettings } from "@/actions/admin-settings"; import RobotsForm from "@/src/components/admin/RobotsForm"; import { PageHeader } from "@/src/components/admin/AdminUI";
export default async function RobotsPage() { return <div><PageHeader title="مدیریت Robots" description="کنترل نمایه‌سازی و دنبال‌کردن لینک‌ها" /><RobotsForm initial={await getSiteSettings()} /></div>; }
