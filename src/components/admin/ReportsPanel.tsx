"use client";

/**
 * Admin reports panel — three URL-driven tabs:
 * 1. Monthly sales (retail / wholesale split)
 * 2. Product inventory
 * 3. Most-viewed products
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ChannelSalesStatsVM,
  InventoryReportItemVM,
  InventoryReportPage,
  MonthlySalesReportVM,
  MostViewedProductVM,
  MostViewedReportPage,
} from "@/actions/admin-reports";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  Select,
  TableShell,
  Toolbar,
  Td,
  Th,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
} from "@/src/components/admin/AdminUI";
import { formatNumberFa, formatToman } from "@/src/lib/format";
import { JALALI_MONTHS } from "@/src/lib/jalali-convert";
import {
  REPORT_TABS,
  buildReportsHref,
  type InventoryStockFilter,
  type ReportsFilters,
  type ReportsTab,
} from "@/src/lib/admin-reports-query";

interface Props {
  filters: ReportsFilters;
  years: number[];
  sales: MonthlySalesReportVM | null;
  inventory: InventoryReportPage | null;
  views: MostViewedReportPage | null;
}

export default function ReportsPanel({
  filters,
  years,
  sales,
  inventory,
  views,
}: Props) {
  const router = useRouter();

  function push(patch: Partial<ReportsFilters>, page?: number) {
    router.push(buildReportsHref({ ...filters, ...patch }, page));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {REPORT_TABS.map((t) => {
          const active = filters.tab === t.key;
          return (
            <Link
              key={t.key}
              href={buildReportsHref({ ...filters, tab: t.key, q: "", stock: "all", sortBy: "", sortDir: "" }, 1)}
              className={[
                "inline-flex items-center rounded-xl px-3.5 py-2 text-sm font-semibold border transition-colors",
                active
                  ? "bg-accent/15 border-accent text-charcoal"
                  : "bg-white border-gray-200 text-gray-600 hover:border-accent/50 hover:bg-amber-50/50",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {filters.tab === "sales" && sales && (
        <SalesReport
          sales={sales}
          filters={filters}
          years={years}
          onChange={(patch) => push(patch, 1)}
        />
      )}

      {filters.tab === "inventory" && inventory && (
        <InventoryReport
          data={inventory}
          filters={filters}
          onChange={(patch) => push(patch, 1)}
        />
      )}

      {filters.tab === "views" && views && (
        <ViewsReport
          data={views}
          filters={filters}
          onChange={(patch) => push(patch, 1)}
        />
      )}
    </div>
  );
}

// ── Sales ─────────────────────────────────────────────────────────────────────

function SalesReport({
  sales,
  filters,
  years,
  onChange,
}: {
  sales: MonthlySalesReportVM;
  filters: ReportsFilters;
  years: number[];
  onChange: (patch: Partial<ReportsFilters>) => void;
}) {
  return (
    <div className="space-y-4">
      <Toolbar>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-semibold text-charcoal">سال</span>
          <Select
            value={String(filters.year)}
            onChange={(e) => onChange({ year: Number(e.target.value) })}
            className="w-28"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {formatNumberFa(y)}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-semibold text-charcoal">ماه</span>
          <Select
            value={String(filters.month)}
            onChange={(e) => onChange({ month: Number(e.target.value) })}
            className="w-36"
          >
            {JALALI_MONTHS.slice(1).map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </Select>
        </label>
        <p className="text-sm text-gray-500 mr-auto">
          گزارش {sales.monthLabel} — سفارشات لغوشده و بایگانی‌شده لحاظ نمی‌شوند
        </p>
      </Toolbar>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <ChannelCard title="جمع کل" tone="accent" stats={sales.total} />
        <ChannelCard title="تک‌فروش (خرده‌فروشی)" tone="default" stats={sales.retail} />
        <ChannelCard title="عمده (همکاران)" tone="wholesale" stats={sales.wholesale} />
      </div>

      <TableShell minWidth="min-w-[720px]">
        <thead className={tableHeadClass}>
          <tr>
            <Th>کانال</Th>
            <Th>تعداد سفارش</Th>
            <Th>مبلغ سفارشات</Th>
            <Th>مبلغ فروش کالا</Th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          <SalesRow label="جمع کل" stats={sales.total} strong />
          <SalesRow label="تک‌فروش" stats={sales.retail} />
          <SalesRow label="عمده" stats={sales.wholesale} />
        </tbody>
      </TableShell>
    </div>
  );
}

function ChannelCard({
  title,
  stats,
  tone,
}: {
  title: string;
  stats: ChannelSalesStatsVM;
  tone: "accent" | "default" | "wholesale";
}) {
  const bar =
    tone === "accent"
      ? "bg-accent"
      : tone === "wholesale"
        ? "bg-accent-dark"
        : "bg-gray-300";

  return (
    <Card className="relative overflow-hidden p-5">
      <span className={`absolute inset-y-0 right-0 w-1 ${bar}`} aria-hidden="true" />
      <p className="text-xs font-medium text-gray-500 mb-3 pr-1">{title}</p>
      <dl className="space-y-2.5 pr-1">
        <div>
          <dt className="text-[11px] text-gray-400">تعداد سفارش</dt>
          <dd className="text-xl font-extrabold text-charcoal tracking-tight">
            {formatNumberFa(stats.orderCount)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-gray-400">مبلغ سفارشات</dt>
          <dd className="text-sm font-bold text-charcoal">
            {formatToman(stats.totalOrderAmount)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-gray-400">مبلغ فروش کالا</dt>
          <dd className="text-sm font-bold text-accent-dark">
            {formatToman(stats.totalSalesAmount)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function SalesRow({
  label,
  stats,
  strong,
}: {
  label: string;
  stats: ChannelSalesStatsVM;
  strong?: boolean;
}) {
  const weight = strong ? "font-extrabold" : "font-semibold";
  return (
    <tr className={tableRowClass}>
      <Td className={weight}>{label}</Td>
      <Td className={weight}>{formatNumberFa(stats.orderCount)}</Td>
      <Td className={weight}>{formatToman(stats.totalOrderAmount)}</Td>
      <Td className={weight}>{formatToman(stats.totalSalesAmount)}</Td>
    </tr>
  );
}

// ── Inventory ─────────────────────────────────────────────────────────────────

function InventoryReport({
  data,
  filters,
  onChange,
}: {
  data: InventoryReportPage;
  filters: ReportsFilters;
  onChange: (patch: Partial<ReportsFilters>) => void;
}) {
  const [qDraft, setQDraft] = useState(filters.q);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryChip label="کل محصولات" value={data.summary.totalProducts} />
        <SummaryChip label="موجود" value={data.summary.inStockCount} tone="success" />
        <SummaryChip label="ناموجود" value={data.summary.outOfStockCount} tone="danger" />
        <SummaryChip label="کم‌موجود (≤۵)" value={data.summary.lowStockCount} tone="warning" />
      </div>

      <Toolbar>
        <form
          className="flex flex-wrap items-center gap-2 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ q: qDraft.trim() });
          }}
        >
          <Input
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="جستجو نام یا کد کالا…"
            className="max-w-xs"
          />
          <Select
            value={filters.stock}
            onChange={(e) =>
              onChange({ stock: e.target.value as InventoryStockFilter, q: qDraft.trim() })
            }
            className="w-40"
          >
            <option value="all">همه موجودی‌ها</option>
            <option value="in_stock">موجود</option>
            <option value="out_of_stock">ناموجود</option>
            <option value="low">کم‌موجود</option>
          </Select>
          <Select
            value={filters.sortBy || "stock"}
            onChange={(e) =>
              onChange({ sortBy: e.target.value, q: qDraft.trim() })
            }
            className="w-36"
          >
            <option value="stock">مرتب‌سازی: موجودی</option>
            <option value="name">مرتب‌سازی: نام</option>
            <option value="sku">مرتب‌سازی: کد</option>
          </Select>
          <Select
            value={filters.sortDir || "asc"}
            onChange={(e) =>
              onChange({ sortDir: e.target.value, q: qDraft.trim() })
            }
            className="w-28"
          >
            <option value="asc">صعودی</option>
            <option value="desc">نزولی</option>
          </Select>
          <button
            type="submit"
            className="rounded-xl bg-charcoal text-white text-sm font-semibold px-3.5 py-2.5 hover:bg-charcoal/90"
          >
            اعمال
          </button>
        </form>
        <p className="text-sm text-gray-500">
          مجموع واحدها: {formatNumberFa(data.summary.totalUnits)}
        </p>
      </Toolbar>

      {data.items.length === 0 ? (
        <Card>
          <EmptyState message="محصولی با این فیلتر یافت نشد." />
        </Card>
      ) : (
        <TableShell minWidth="min-w-[800px]">
          <thead className={tableHeadClass}>
            <tr>
              <Th>کد</Th>
              <Th>نام محصول</Th>
              <Th>دسته‌بندی</Th>
              <Th>برند</Th>
              <Th>موجودی</Th>
              <Th>وضعیت</Th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {data.items.map((item) => (
              <InventoryRow key={item.id} item={item} />
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

function InventoryRow({ item }: { item: InventoryReportItemVM }) {
  const stockTone =
    item.stock <= 0 ? "danger" : item.stock <= 5 ? "warning" : "success";
  return (
    <tr className={tableRowClass}>
      <Td>
        <Link
          href={`/admin/products/${item.id}`}
          className="font-mono text-xs text-accent-dark hover:underline"
        >
          {item.sku}
        </Link>
      </Td>
      <Td>
        <Link
          href={`/admin/products/${item.id}`}
          className="font-semibold hover:text-accent-dark"
        >
          {item.name}
        </Link>
      </Td>
      <Td className="text-gray-600">{item.categoryName}</Td>
      <Td className="text-gray-600">{item.partsBrandName}</Td>
      <Td>
        <Badge tone={stockTone}>{formatNumberFa(item.stock)}</Badge>
      </Td>
      <Td>
        <Badge tone={item.isActive ? "success" : "default"}>
          {item.isActive ? "فعال" : "غیرفعال"}
        </Badge>
      </Td>
    </tr>
  );
}

// ── Views ─────────────────────────────────────────────────────────────────────

function ViewsReport({
  data,
  filters,
  onChange,
}: {
  data: MostViewedReportPage;
  filters: ReportsFilters;
  onChange: (patch: Partial<ReportsFilters>) => void;
}) {
  const [qDraft, setQDraft] = useState(filters.q);

  return (
    <div className="space-y-4">
      <Toolbar>
        <form
          className="flex flex-wrap items-center gap-2 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ q: qDraft.trim() });
          }}
        >
          <Input
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="جستجو نام یا کد کالا…"
            className="max-w-xs"
          />
          <Select
            value={filters.sortBy || "viewCount"}
            onChange={(e) =>
              onChange({ sortBy: e.target.value, q: qDraft.trim() })
            }
            className="w-44"
          >
            <option value="viewCount">مرتب‌سازی: بازدید</option>
            <option value="saleCount">مرتب‌سازی: فروش</option>
            <option value="name">مرتب‌سازی: نام</option>
          </Select>
          <Select
            value={filters.sortDir || "desc"}
            onChange={(e) =>
              onChange({ sortDir: e.target.value, q: qDraft.trim() })
            }
            className="w-28"
          >
            <option value="desc">نزولی</option>
            <option value="asc">صعودی</option>
          </Select>
          <button
            type="submit"
            className="rounded-xl bg-charcoal text-white text-sm font-semibold px-3.5 py-2.5 hover:bg-charcoal/90"
          >
            اعمال
          </button>
        </form>
      </Toolbar>

      {data.items.length === 0 ? (
        <Card>
          <EmptyState message="محصولی یافت نشد." />
        </Card>
      ) : (
        <TableShell minWidth="min-w-[800px]">
          <thead className={tableHeadClass}>
            <tr>
              <Th>#</Th>
              <Th>کد</Th>
              <Th>نام محصول</Th>
              <Th>دسته‌بندی</Th>
              <Th>بازدید</Th>
              <Th>فروش (واحد)</Th>
              <Th>موجودی</Th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {data.items.map((item, index) => (
              <ViewsRow
                key={item.id}
                item={item}
                rank={(data.page - 1) * data.perPage + index + 1}
              />
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

function ViewsRow({ item, rank }: { item: MostViewedProductVM; rank: number }) {
  return (
    <tr className={tableRowClass}>
      <Td className="text-gray-400 font-bold w-12">{formatNumberFa(rank)}</Td>
      <Td>
        <Link
          href={`/admin/products/${item.id}`}
          className="font-mono text-xs text-accent-dark hover:underline"
        >
          {item.sku}
        </Link>
      </Td>
      <Td>
        <Link
          href={`/products/${item.id}`}
          className="font-semibold hover:text-accent-dark"
        >
          {item.name}
        </Link>
        {!item.isActive && (
          <span className="mr-2">
            <Badge tone="default">غیرفعال</Badge>
          </span>
        )}
      </Td>
      <Td className="text-gray-600">{item.categoryName}</Td>
      <Td className="font-extrabold text-accent-dark">
        {formatNumberFa(item.viewCount)}
      </Td>
      <Td>{formatNumberFa(item.saleCount)}</Td>
      <Td>
        <Badge tone={item.stock <= 0 ? "danger" : "success"}>
          {formatNumberFa(item.stock)}
        </Badge>
      </Td>
    </tr>
  );
}

function SummaryChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const tones = {
    default: "text-charcoal",
    success: "text-green-700",
    danger: "text-red-600",
    warning: "text-amber-600",
  };
  return (
    <Card className="p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-extrabold tracking-tight ${tones[tone]}`}>
        {formatNumberFa(value)}
      </p>
    </Card>
  );
}

// Re-export tab type for the page parser
export type { ReportsTab };
