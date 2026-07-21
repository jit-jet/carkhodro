import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentAdmin } from "@/src/lib/admin-session";
import AdminLoginForm from "@/src/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "ورود مدیر | کارخودرو",
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginCardFallback />}>
      <AdminLoginContent />
    </Suspense>
  );
}

async function AdminLoginContent() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <div className="w-full max-w-md" dir="rtl">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/25">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7 text-charcoal"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h1 className="text-white text-xl font-extrabold tracking-tight">پنل مدیریت کارخودرو</h1>
        <p className="text-white/50 text-sm mt-1.5">برای ادامه وارد حساب مدیر شوید</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl border border-white/10 p-6 sm:p-8">
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}

function LoginCardFallback() {
  return <div className="w-full max-w-md h-96 rounded-2xl bg-white/10 animate-pulse" />;
}
