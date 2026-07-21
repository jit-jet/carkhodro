"use client";

/**
 * Admin panel sidebar — desktop: fixed right-hand rail; mobile: slide-over
 * drawer toggled from the topbar hamburger. Active link highlighting via
 * `usePathname`, logout via `adminLogout`.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminLogout } from "@/actions/admin-auth";

type IconKey =
  | "grid"
  | "category"
  | "car"
  | "box"
  | "users"
  | "orders"
  | "sms"
  | "settings"
  | "faq"
  | "menu"
  | "blog";

interface NavItem {
  href: string;
  label: string;
  icon: IconKey;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "داشبورد", icon: "grid" },
  { href: "/admin/products", label: "محصولات و قیمت‌گذاری", icon: "box" },
  { href: "/admin/orders", label: "سفارشات و فاکتورها", icon: "orders" },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: "category" },
  { href: "/admin/brands", label: "برندها و خودروها", icon: "car" },
  { href: "/admin/posts", label: "مقالات وبلاگ", icon: "blog" },
  { href: "/admin/users", label: "کاربران", icon: "users" },
  { href: "/admin/sms", label: "پیامک گروهی", icon: "sms" },
  { href: "/admin/navigation", label: "منوی سایت", icon: "menu" },
  { href: "/admin/faq", label: "سوالات متداول", icon: "faq" },
  { href: "/admin/settings", label: "تنظیمات سایت", icon: "settings" },
];

function NavIcon({ icon }: { icon: IconKey }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "w-[18px] h-[18px] shrink-0",
  };
  switch (icon) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "category":
      return (
        <svg {...common}>
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
        </svg>
      );
    case "car":
      return (
        <svg {...common}>
          <path d="M5 17h14M5 17a2 2 0 100 4 2 2 0 000-4zm14 0a2 2 0 100 4 2 2 0 000-4zM3 17V9l2-4h14l2 4v8" />
        </svg>
      );
    case "box":
      return (
        <svg {...common}>
          <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
    case "sms":
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    case "faq":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 115.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      );
    case "blog":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="11" x2="16" y2="11" />
          <line x1="8" y1="15" x2="12" y2="15" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      );
  }
}

export default function AdminSidebar({
  adminName,
  onNavigate,
}: {
  adminName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, startLogout] = useTransition();

  function isActive(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/posts") {
      return (
        pathname === href ||
        pathname.startsWith(`${href}/`) ||
        pathname.startsWith("/admin/post-categories")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleLogout() {
    startLogout(async () => {
      await adminLogout();
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <aside className="h-full flex flex-col bg-charcoal text-white w-72 border-l border-black/20">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-white/40 mb-0.5">پنل مدیریت</p>
            <p className="font-extrabold text-accent text-base leading-tight truncate">کارخودرو</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2.5" aria-label="منوی مدیریت">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-accent text-charcoal shadow-sm shadow-accent/20"
                      : "text-white/65 hover:bg-white/8 hover:text-white",
                  ].join(" ")}
                >
                  <NavIcon icon={item.icon} />
                  <span className="flex-1 leading-snug">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2.5 border-t border-white/10">
        <div className="px-3 py-2 mb-1 rounded-xl bg-white/5">
          <p className="text-[11px] text-white/40">ورود به عنوان</p>
          <p className="text-sm font-semibold truncate text-white/90">{adminName || "مدیر سیستم"}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-300 hover:bg-red-500/15 transition-colors disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[18px] h-[18px] shrink-0"
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {loggingOut ? "در حال خروج…" : "خروج"}
        </button>
      </div>
    </aside>
  );
}
