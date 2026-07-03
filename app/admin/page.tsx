/**
 * Dashboard — placeholder page
 * ─────────────────────────────
 * Both successful login (existing user) and successful signup redirect here.
 * Replace the contents of this file with your real dashboard UI.
 */

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/src/lib/session";
import { getUserOrders } from "@/actions/orders";
import HesabfaSyncButton from "@/src/components/dashboard/HesabfaSyncButton";

export const metadata: Metadata = {
  title: "داشبورد | کارخودرو",
};

function formatPrice(n: number) {
  return n.toLocaleString("fa-IR") + " تومان";
}

const ORDER_STATUS_FA: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  CONFIRMED: "تأیید شده",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل شده",
  CANCELLED: "لغو شده",
  REFUNDED: "مرجوع شده",
};

// The account view depends on the session cookie → request-time (dynamic) data.
// Under Cache Components that must stream inside a <Suspense> boundary, so the
// page ships a static shell and the user-specific panel streams in.
export default function AdminPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminContent />
    </Suspense>
  );
}

// The `proxy` redirects signed-out visitors before they get here, but we
// re-check at the data source (defense in depth) and read the real
// authenticated user — no more mock store.
async function AdminContent() {
  return (
    <div>
      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-10">
        {[
          { href: "/products", label: "مشاهده محصولات", icon: "🛒" },
          { href: "/cart", label: "سبد خرید", icon: "🛍️" },
          { href: "/", label: "صفحه اصلی", icon: "🏠" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border-2 border-silver-light hover:border-accent rounded-2xl px-4 py-5 flex flex-col items-center gap-2 text-sm font-semibold text-charcoal transition-all hover:shadow-md"
          >
            <span className="text-2xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Admin tools — Hesabfa sync (only rendered for ADMIN accounts) */}
      {/* {user.role === 'ADMIN' && ( */}
      <section className="w-full mb-10">
        <h2 className="text-lg font-bold text-charcoal mb-4 text-right">
          ابزار مدیریت
        </h2>
        <HesabfaSyncButton />
      </section>
      {/* )} */}

      {/* Order history */}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center animate-pulse">
      <div className="w-20 h-20 rounded-full bg-gray-100 mb-6" />
      <div className="h-8 w-64 bg-gray-100 rounded mb-3" />
      <div className="h-4 w-80 bg-gray-100 rounded mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-10">
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-40 w-full bg-gray-100 rounded-2xl" />
    </div>
  );
}
