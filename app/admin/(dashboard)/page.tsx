import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getAdminDashboardStats } from "@/actions/admin-dashboard";
import { Card, CardHeader, PageHeader } from "@/src/components/admin/AdminUI";
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
    {
      label: "محصولات فعال",
      value: stats.activeProductCount,
      href: "/admin/products",
      tone: "text-charcoal",
      bar: "bg-accent",
    },
    {
      label: "کل محصولات",
      value: stats.productCount,
      href: "/admin/products",
      tone: "text-charcoal",
      bar: "bg-charcoal",
    },
    {
      label: "ناموجود",
      value: stats.outOfStockCount,
      href: "/admin/products",
      tone: "text-red-600",
      bar: "bg-red-400",
    },
    {
      label: "دسته‌بندی‌ها",
      value: stats.categoryCount,
      href: "/admin/categories",
      tone: "text-charcoal",
      bar: "bg-gray-300",
    },
    {
      label: "همکاران (عمده)",
      value: stats.partnerCount,
      href: "/admin/users",
      tone: "text-accent-dark",
      bar: "bg-accent-dark",
    },
    {
      label: "مشتریان تک‌فروش",
      value: stats.retailCount,
      href: "/admin/users",
      tone: "text-charcoal",
      bar: "bg-gray-300",
    },
    {
      label: "سفارشات در انتظار",
      value: stats.pendingOrderCount,
      href: "/admin/orders",
      tone: "text-amber-600",
      bar: "bg-amber-400",
    },
    {
      label: "پیامک‌های ارسالی",
      value: stats.smsCampaignCount,
      href: "/admin/sms",
      tone: "text-charcoal",
      bar: "bg-gray-300",
    },
  ];

  const quickLinks = [
    { href: "/admin/products/new", label: "افزودن محصول جدید" },
    { href: "/admin/sms", label: "ارسال پیامک گروهی" },
    { href: "/admin/orders", label: "سفارشات و فاکتورها" },
    { href: "/admin/users", label: "مدیریت نقش همکاران" },
    { href: "/admin/settings", label: "ویرایش اطلاعات تماس سایت" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="group block h-full">
            <Card className="relative overflow-hidden p-5 h-full transition-all group-hover:shadow-md group-hover:border-accent/40">
              <span className={`absolute inset-y-0 right-0 w-1 ${c.bar}`} aria-hidden="true" />
              <p className="text-xs font-medium text-gray-500 mb-2.5 pr-1">{c.label}</p>
              <p className={`text-2xl font-extrabold tracking-tight pr-1 ${c.tone}`}>
                {formatNumberFa(c.value)}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader title="دسترسی سریع" description="میانبرهای پرکاربرد پنل مدیریت" />
        <div className="p-5 sm:p-6 flex flex-wrap gap-2.5">
          {quickLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-charcoal hover:border-accent hover:bg-amber-50/60 transition-colors"
            >
              <span className="text-accent-dark">+</span>
              {link.label}
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-24 bg-white rounded-2xl border border-gray-200/80 animate-pulse" />
      ))}
    </div>
  );
}
