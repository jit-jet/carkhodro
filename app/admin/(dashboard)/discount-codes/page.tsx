import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getDiscountCodesAdmin,
  type AdminDiscountCodeFilters,
} from "@/actions/discount-codes";
import type { DiscountType } from "@/generated/prisma_client";
import { PageHeader, Button } from "@/src/components/admin/AdminUI";
import DiscountCodesTable from "@/src/components/admin/DiscountCodesTable";
import { formatNumberFa } from "@/src/lib/format";

export const metadata: Metadata = { title: "کد تخفیف | پنل مدیریت" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TYPE_VALUES: DiscountType[] = ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"];

function pick(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parseType(value: string): DiscountType | "all" {
  return TYPE_VALUES.includes(value as DiscountType) ? (value as DiscountType) : "all";
}

function parseStatus(value: string): AdminDiscountCodeFilters["status"] {
  if (value === "active" || value === "inactive") return value;
  return "all";
}

function buildHref(filters: { search: string; status: string; type: string }, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (page > 1) params.set("page", String(page));
  const q = params.toString();
  return q ? `/admin/discount-codes?${q}` : "/admin/discount-codes";
}

export default function AdminDiscountCodesPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <DiscountCodesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DiscountCodesContent({ searchParams }: Props) {
  const sp = await searchParams;
  const search = pick(sp.search);
  const status = pick(sp.status);
  const type = pick(sp.type);
  const page = Number(pick(sp.page)) || 1;
  const filters = { search, status: status || "all", type: type || "all" };

  const data = await getDiscountCodesAdmin({
    search: search || undefined,
    status: parseStatus(status),
    type: parseType(type),
    page,
    perPage: 20,
  });

  return (
    <div>
      <PageHeader
        title="کدهای تخفیف"
        description={`تعداد ${formatNumberFa(data.total)} کد تخفیف`}
        action={
          <Link href="/admin/discount-codes/new">
            <Button type="button">+ کد تخفیف جدید</Button>
          </Link>
        }
      />

      <DiscountCodesTable items={data.items} total={data.total} filters={filters} />

      {data.pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-5">
          {Array.from({ length: data.pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildHref(filters, p)}
              className={[
                "min-w-9 h-9 px-2 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                p === data.page
                  ? "bg-accent text-charcoal"
                  : "bg-white border border-gray-200 text-charcoal hover:bg-silver-light",
              ].join(" ")}
            >
              {p.toLocaleString("fa-IR")}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
