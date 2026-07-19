import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getAdminDashboardStats } from "@/actions/admin-dashboard";
import { Card, PageHeader } from "@/src/components/admin/AdminUI";
import { formatNumberFa } from "@/src/lib/format";

export const metadata: Metadata = { title: "داشبورد مدیریت | کارخودرو" };

export default function AdminHomePage() {
  return (
    <div>
      <PageHeader title="داشبورد مدیریت" description="نمای کلی از فروشگاه کارخودرو" />
      <Suspense fallback={<StatsSkeleton />}>
        <AdminHomeContent />
      </Suspense>
    </div>
  );
}

async function AdminHomeContent() {
  const stats = await getAdminDashboardStats();

  const cards = [
    { label: "محصولات فعال", value: stats.activeProductCount, href: "/admin/products", tone: "text-charcoal" },
    { label: "کل محصولات", value: stats.productCount, href: "/admin/products", tone: "text-charcoal" },
    { label: "ناموجود", value: stats.outOfStockCount, href: "/admin/products", tone: "text-red-600" },
    { label: "دسته‌بندی‌ها", value: stats.categoryCount, href: "/admin/categories", tone: "text-charcoal" },
    { label: "همکاران (عمده)", value: stats.partnerCount, href: "/admin/users", tone: "text-accent-dark" },
    { label: "مشتریان تک‌فروش", value: stats.retailCount, href: "/admin/users", tone: "text-charcoal" },
    { label: "سفارشات در انتظار", value: stats.pendingOrderCount, href: "/admin/orders", tone: "text-amber-600" },
    { label: "پیامک‌های ارسالی", value: stats.smsCampaignCount, href: "/admin/sms", tone: "text-charcoal" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="p-5 hover:shadow-md transition-shadow h-full">
              <p className="text-xs text-gray-400 mb-2">{c.label}</p>
              <p className={`text-2xl font-extrabold ${c.tone}`}>{formatNumberFa(c.value)}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-5 sm:p-6 mt-6">
        <h2 className="font-bold text-charcoal mb-3">دسترسی سریع</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/products/new" className="text-sm font-semibold text-accent-dark hover:underline">
            + افزودن محصول جدید
          </Link>
          <Link href="/admin/sms" className="text-sm font-semibold text-accent-dark hover:underline">
            ارسال پیامک گروهی
          </Link>
          <Link href="/admin/orders" className="text-sm font-semibold text-accent-dark hover:underline">
            سفارشات و فاکتورها
          </Link>
          <Link href="/admin/users" className="text-sm font-semibold text-accent-dark hover:underline">
            مدیریت نقش همکاران
          </Link>
          <Link href="/admin/settings" className="text-sm font-semibold text-accent-dark hover:underline">
            ویرایش اطلاعات تماس سایت
          </Link>
        </div>
      </Card>
    </>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      ))}
    </div>
  );
}
