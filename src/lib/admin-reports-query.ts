/**
 * URL helpers + Jalali month utilities for the admin reports hub —
 * directive-free so server pages, client panels, and actions can all share them.
 */

import {
  ADMIN_DEFAULT_PER_PAGE,
  appendPaginationParams,
} from "@/src/lib/admin-pagination";
import {
  JALALI_MONTHS,
  gregorianToJalali,
  jalaliPartsToDate,
} from "@/src/lib/jalali-convert";

export type ReportsTab = "sales" | "inventory" | "views";

export type InventoryStockFilter = "all" | "in_stock" | "out_of_stock" | "low";

export type InventorySortBy = "stock" | "name" | "sku";
export type ViewsSortBy = "viewCount" | "saleCount" | "name";
export type ReportSortDir = "asc" | "desc";

export interface ReportsFilters {
  tab: ReportsTab;
  year: number;
  month: number;
  q: string;
  stock: InventoryStockFilter;
  sortBy: string;
  sortDir: string;
  perPage: number;
}

export const REPORT_TABS: { key: ReportsTab; label: string }[] = [
  { key: "sales", label: "فروش ماهانه" },
  { key: "inventory", label: "موجودی کالا" },
  { key: "views", label: "پربازدیدترین محصولات" },
];

export function buildReportsHref(filters: ReportsFilters, page?: number): string {
  const params = new URLSearchParams();
  if (filters.tab !== "sales") params.set("tab", filters.tab);
  if (filters.tab === "sales") {
    params.set("year", String(filters.year));
    params.set("month", String(filters.month));
  }
  if (filters.tab === "inventory" || filters.tab === "views") {
    if (filters.q) params.set("q", filters.q);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortDir) params.set("sortDir", filters.sortDir);
  }
  if (filters.tab === "inventory" && filters.stock !== "all") {
    params.set("stock", filters.stock);
  }
  appendPaginationParams(params, page, filters.perPage, ADMIN_DEFAULT_PER_PAGE);
  const qs = params.toString();
  return qs ? `/admin/reports?${qs}` : "/admin/reports";
}

export function jalaliMonthLabel(year: number, month: number): string {
  const name = JALALI_MONTHS[month] ?? "";
  return name ? `${name} ${year}` : `${year}/${month}`;
}

/** Inclusive Jalali month → half-open Gregorian `[start, end)` range (UTC). */
export function jalaliMonthRange(
  jy: number,
  jm: number,
): { start: Date; end: Date } | null {
  if (!Number.isFinite(jy) || !Number.isFinite(jm) || jm < 1 || jm > 12) return null;
  const start = jalaliPartsToDate(jy, jm, 1);
  if (!start) return null;
  let nextY = jy;
  let nextM = jm + 1;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  const end = jalaliPartsToDate(nextY, nextM, 1);
  if (!end) return null;
  return { start, end };
}

export function currentJalaliYearMonth(): { year: number; month: number } {
  const now = new Date();
  const { jy, jm } = gregorianToJalali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
  return { year: jy, month: jm };
}

export function availableJalaliYears(span = 6): number[] {
  const { year } = currentJalaliYearMonth();
  return Array.from({ length: span }, (_, i) => year - i);
}

export { JALALI_MONTHS };
