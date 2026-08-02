import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getDiscountCodesAdmin,
  type AdminDiscountCodeFilters,
} from "@/actions/discount-codes";
import type { DiscountType } from "@/generated/prisma_client";
import { PageHeader, Button } from "@/src/components/admin/AdminUI";
import AdminPagination from "@/src/components/admin/AdminPagination";
import DiscountCodesTable from "@/src/components/admin/DiscountCodesTable";
import { parsePage, parsePerPage, pickSearchParam } from "@/src/lib/admin-pagination";
import { formatNumberFa } from "@/src/lib/format";

export const metadata: Metadata = { title: "کد تخفیف | پنل مدیریت" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TYPE_VALUES: DiscountType[] = ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"];

function parseType(value: string): DiscountType | "all" {
  return TYPE_VALUES.includes(value as DiscountType) ? (value as DiscountType) : "all";
}

function parseStatus(value: string): AdminDiscountCodeFilters["status"] {
  if (value === "active" || value === "inactive") return value;
  return "all";
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
  const search = pickSearchParam(sp.search);
  const status = pickSearchParam(sp.status);
  const type = pickSearchParam(sp.type);
  const page = parsePage(sp.page);
  const perPage = parsePerPage(sp.perPage);
  const filters = {
    search,
    status: status || "all",
    type: type || "all",
    perPage,
  };

  const data = await getDiscountCodesAdmin({
    search: search || undefined,
    status: parseStatus(status),
    type: parseType(type),
    page,
    perPage,
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

      <AdminPagination
        page={data.page}
        pageCount={data.pageCount}
        total={data.total}
        perPage={data.perPage}
        pathname="/admin/discount-codes"
        query={{
          ...(search ? { search } : {}),
          ...(filters.status !== "all" ? { status: filters.status } : {}),
          ...(filters.type !== "all" ? { type: filters.type } : {}),
        }}
      />
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
