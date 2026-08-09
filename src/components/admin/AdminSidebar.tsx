"use client";

/**
 * Admin panel sidebar — desktop: fixed right-hand rail; mobile: slide-over
 * drawer toggled from the topbar hamburger. Active link highlighting via
 * `usePathname`, logout via `adminLogout`. Sections are collapsible.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { adminLogout } from "@/actions/admin-auth";
import { useCartUI } from "@/src/store/cart-ui";

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
  | "blog"
  | "comms"
  | "discount"
  | "rules"
  | "accounting"
  | "shipping"
  | "social"
  | "trust"
  | "banner"
  | "sales"
  | "finance"
  | "reports"
  | "content"
  | "chevron";

interface NavItem {
  href: string;
  label: string;
  icon: IconKey;
}

interface NavSection {
  id: string;
  label: string;
  icon: IconKey;
  items: NavItem[];
}

const DASHBOARD_ITEM: NavItem = {
  href: "/admin",
  label: "داشبورد",
  icon: "grid",
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "sales",
    label: "فروش",
    icon: "sales",
    items: [
      { href: "/admin/products", label: "محصولات و قیمت‌گذاری", icon: "box" },
      { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: "category" },
      { href: "/admin/brands", label: "برندها و خودروها", icon: "car" },
      { href: "/admin/orders", label: "سفارشات و فاکتورها", icon: "orders" },
      { href: "/admin/shipping", label: "روش‌های ارسال", icon: "shipping" },
      { href: "/admin/discount-codes", label: "کد تخفیف", icon: "discount" },
    ],
  },
  {
    id: "users",
    label: "کاربران",
    icon: "users",
    items: [
      { href: "/admin/users", label: "کاربران", icon: "users" },
      { href: "/admin/communications", label: "مدیریت ارتباطات", icon: "comms" },
      { href: "/admin/sms", label: "پیامک گروهی", icon: "sms" },
    ],
  },
  {
    id: "finance",
    label: "مالی",
    icon: "finance",
    items: [
      { href: "/admin/reports", label: "گزارش‌ها", icon: "reports" },
      { href: "/admin/accounting", label: "حسابداری", icon: "accounting" },
    ],
  },
  {
    id: "content",
    label: "مدیریت محتوا",
    icon: "content",
    items: [
      { href: "/admin/posts", label: "مقالات وبلاگ", icon: "blog" },
      { href: "/admin/hero-banners", label: "بنرهای صفحه اصلی", icon: "banner" },
      { href: "/admin/navigation", label: "منوی سایت", icon: "menu" },
      { href: "/admin/footer-links", label: "لینک‌های فوتر", icon: "menu" },
      { href: "/admin/social-links", label: "شبکه‌های اجتماعی", icon: "social" },
      { href: "/admin/trust-badges", label: "نشان‌های اعتماد فوتر", icon: "trust" },
      { href: "/admin/faq", label: "سوالات متداول", icon: "faq" },
      { href: "/admin/rules", label: "قوانین و مقررات", icon: "rules" },
    ],
  },
  {
    id: "settings",
    label: "تنظیمات",
    icon: "settings",
    items: [
      { href: "/admin/settings", label: "تنظیمات سایت", icon: "settings" },
      { href: "/admin/system-settings", label: "تنظیمات سیستم", icon: "settings" },
      { href: "/admin/admin-logs", label: "گزارش فعالیت مدیران", icon: "reports" },
    ],
  },
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
    case "shipping":
      return (
        <svg {...common}>
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <path d="M16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "sms":
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case "comms":
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          <path d="M8 9h8M8 13h5" />
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
    case "discount":
      return (
        <svg {...common}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case "rules":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
    case "accounting":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 8h10M7 12h10M7 16h6" />
        </svg>
      );
    case "social":
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      );
    case "trust":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "banner":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="M21 15l-5-5-4 4-2-2-4 4" />
        </svg>
      );
    case "sales":
      return (
        <svg {...common}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      );
    case "finance":
      return (
        <svg {...common}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common}>
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      );
    case "content":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common} className="w-4 h-4 shrink-0">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );
  }
}

function isItemActive(pathname: string, href: string): boolean {
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

function sectionHasActive(pathname: string, section: NavSection): boolean {
  return section.items.some((item) => isItemActive(pathname, item.href));
}

export default function AdminSidebar({
  adminName,
  isSuperAdmin,
  onNavigate,
}: {
  adminName: string;
  isSuperAdmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const [loggingOut, startLogout] = useTransition();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const section of NAV_SECTIONS) {
      initial[section.id] = sectionHasActive(pathname, section);
    }
    return initial;
  });

  useEffect(() => {
    setOpenSections((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const section of NAV_SECTIONS) {
        if (sectionHasActive(pathname, section) && !next[section.id]) {
          next[section.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname]);

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleLogout() {
    startLogout(async () => {
      await adminLogout();
      notify({
        variant: "success",
        title: "خروج موفق",
        description: "با موفقیت از پنل خارج شدید.",
      });
      router.push("/admin/login");
      router.refresh();
    });
  }

  const dashboardActive = isItemActive(pathname, DASHBOARD_ITEM.href);

  return (
    <aside className="h-full flex flex-col bg-charcoal text-white w-72 border-l border-black/20">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-white/40 mb-0.5">پنل مدیریت</p>
            <Link href="/">
              <p className="font-extrabold text-accent text-base leading-tight truncate">کارخودرو</p>
            </Link>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2.5" aria-label="منوی مدیریت">
        <ul className="space-y-0.5">
          <li>
            <Link
              href={DASHBOARD_ITEM.href}
              onClick={onNavigate}
              aria-current={dashboardActive ? "page" : undefined}
              className={[
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors",
                dashboardActive
                  ? "bg-accent text-charcoal shadow-sm shadow-accent/20"
                  : "text-white/65 hover:bg-white/8 hover:text-white",
              ].join(" ")}
            >
              <NavIcon icon={DASHBOARD_ITEM.icon} />
              <span className="flex-1 leading-snug">{DASHBOARD_ITEM.label}</span>
            </Link>
          </li>

          {NAV_SECTIONS.map((section) => {
            const open = !!openSections[section.id];
            const sectionActive = sectionHasActive(pathname, section);

            return (
              <li key={section.id} className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={open}
                  className={[
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-colors",
                    sectionActive
                      ? "text-white bg-white/8"
                      : "text-white/50 hover:bg-white/8 hover:text-white/80",
                  ].join(" ")}
                >
                  <NavIcon icon={section.icon} />
                  <span className="flex-1 text-right leading-snug">{section.label}</span>
                  <span
                    className={[
                      "transition-transform duration-200 text-white/40",
                      open ? "rotate-180" : "",
                    ].join(" ")}
                  >
                    <NavIcon icon="chevron" />
                  </span>
                </button>

                <div
                  className={[
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  ].join(" ")}
                >
                  <ul className="overflow-hidden space-y-0.5 mt-0.5 mr-2 border-r border-white/10 pr-1">
                    {section.items
                      .filter((item) => item.href !== "/admin/system-settings" || isSuperAdmin)
                      .map((item) => {
                      const active = isItemActive(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={active ? "page" : undefined}
                            className={[
                              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold transition-colors",
                              active
                                ? "bg-accent text-charcoal shadow-sm shadow-accent/20"
                                : "text-white/55 hover:bg-white/8 hover:text-white",
                            ].join(" ")}
                          >
                            <NavIcon icon={item.icon} />
                            <span className="flex-1 leading-snug">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
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
