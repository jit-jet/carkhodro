import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import {
  availableJalaliYears,
  currentJalaliYearMonth,
} from "@/src/lib/admin-reports-query";
import {
  getInventoryReport,
  getMonthlySalesReport,
  getMostViewedProductsReport,
} from "@/actions/admin-reports";
import { PageHeader } from "@/src/components/admin/AdminUI";
import AdminPagination from "@/src/components/admin/AdminPagination";
import ReportsPanel from "@/src/components/admin/ReportsPanel";
import {
  parsePage,
  parsePerPage,
  pickSearchParam,
} from "@/src/lib/admin-pagination";
import type {
  InventorySortBy,
  InventoryStockFilter,
  ReportSortDir,
  ReportsFilters,
  ReportsTab,
  ViewsSortBy,
} from "@/src/lib/admin-reports-query";

export const metadata: Metadata = { title: "گزارش‌ها | پنل مدیریت" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseTab(value: string): ReportsTab {
  if (value === "inventory" || value === "views" || value === "sales") return value;
  return "sales";
}

function parseStock(value: string): InventoryStockFilter {
  if (
    value === "in_stock" ||
    value === "out_of_stock" ||
    value === "low" ||
    value === "all"
  ) {
    return value;
  }
  return "all";
}

function parseSortDir(value: string, fallback: ReportSortDir): ReportSortDir {
  return value === "asc" || value === "desc" ? value : fallback;
}

export default function AdminReportsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReportsContent({ searchParams }: Props) {
  // Opt into request-time rendering (month range uses `new Date()`).
  await connection();

  const sp = await searchParams;
  const tab = parseTab(pickSearchParam(sp.tab));
  const now = currentJalaliYearMonth();
  const yearRaw = Number(pickSearchParam(sp.year));
  const monthRaw = Number(pickSearchParam(sp.month));
  const year =
    Number.isFinite(yearRaw) && yearRaw >= 1300 && yearRaw <= 1600
      ? Math.floor(yearRaw)
      : now.year;
  const month =
    Number.isFinite(monthRaw) && monthRaw >= 1 && monthRaw <= 12
      ? Math.floor(monthRaw)
      : now.month;
  const q = pickSearchParam(sp.q);
  const stock = parseStock(pickSearchParam(sp.stock));
  const sortBy = pickSearchParam(sp.sortBy);
  const sortDir = pickSearchParam(sp.sortDir);
  const page = parsePage(sp.page);
  const perPage = parsePerPage(sp.perPage);

  const filters: ReportsFilters = {
    tab,
    year,
    month,
    q,
    stock,
    sortBy,
    sortDir,
    perPage,
  };

  const years = availableJalaliYears();

  const [sales, inventory, views] = await Promise.all([
    tab === "sales"
      ? getMonthlySalesReport(year, month)
      : Promise.resolve(null),
    tab === "inventory"
      ? getInventoryReport({
          q: q || undefined,
          stock,
          sortBy: (sortBy as InventorySortBy) || "stock",
          sortDir: parseSortDir(sortDir, "asc"),
          page,
          perPage,
        })
      : Promise.resolve(null),
    tab === "views"
      ? getMostViewedProductsReport({
          q: q || undefined,
          sortBy: (sortBy as ViewsSortBy) || "viewCount",
          sortDir: parseSortDir(sortDir, "desc"),
          page,
          perPage,
        })
      : Promise.resolve(null),
  ]);

  const listMeta =
    tab === "inventory"
      ? inventory
      : tab === "views"
        ? views
        : null;

  const paginationQuery: Record<string, string> = {
    tab: tab === "sales" ? "" : tab,
    ...(tab === "sales"
      ? { year: String(year), month: String(month) }
      : {}),
    ...(q ? { q } : {}),
    ...(tab === "inventory" && stock !== "all" ? { stock } : {}),
    ...(sortBy ? { sortBy } : {}),
    ...(sortDir ? { sortDir } : {}),
  };
  // Drop empty tab key for cleaner URLs when on sales default
  if (!paginationQuery.tab) delete paginationQuery.tab;

  return (
    <div>
      <PageHeader
        title="گزارش‌ها"
        description="فروش ماهانه، موجودی انبار و پربازدیدترین محصولات"
      />

      <ReportsPanel
        filters={filters}
        years={years}
        sales={sales}
        inventory={inventory}
        views={views}
      />

      {listMeta && (
        <AdminPagination
          page={listMeta.page}
          pageCount={listMeta.pageCount}
          total={listMeta.total}
          perPage={listMeta.perPage}
          pathname="/admin/reports"
          query={paginationQuery}
        />
      )}
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-80 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-12 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ))}
      </div>
      <div className="h-72 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
