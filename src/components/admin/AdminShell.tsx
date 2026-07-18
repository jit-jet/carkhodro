"use client";

/**
 * Responsive admin chrome: fixed sidebar on desktop (lg+), slide-over drawer
 * on mobile/tablet triggered by the topbar hamburger. Wraps every
 * `/admin/(dashboard)/*` page.
 */

import { useState } from "react";
import AdminSidebar from "@/src/components/admin/AdminSidebar";

export default function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-silver-light flex" dir="rtl">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <div className="fixed inset-y-0 right-0 w-72">
          <AdminSidebar adminName={adminName} />
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 right-0 w-72 shadow-2xl">
            <AdminSidebar adminName={adminName} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 lg:mr-72 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 bg-charcoal text-white flex items-center justify-between px-4 py-3 shadow-sm">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="باز کردن منو"
            className="p-2 -mr-2 rounded-lg hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <p className="font-extrabold text-accent">پنل مدیریت کارخودرو</p>
          <span className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
