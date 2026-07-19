import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getOrdersAdmin,
  type AdminOrderSortBy,
  type AdminOrderSortDir,
} from "@/actions/admin-orders";
import { PageHeader } from "@/src/components/admin/AdminUI";
import OrdersTable from "@/src/components/admin/OrdersTable";
import { buildOrdersHref } from "@/src/lib/admin-orders-query";
import { formatNumberFa } from "@/src/lib/format";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma_client";

export const metadata: Metadata = { title: "سفارشات و فاکتورها | پنل مدیریت" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const SORT_BY_VALUES: AdminOrderSortBy[] = [
  "orderNumber",
  "customer",
  "phone",
  "status",
  "paymentStatus",
  "total",
  "createdAt",
];

function pick(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parseSortBy(value: string): AdminOrderSortBy | undefined {
  return SORT_BY_VALUES.includes(value as AdminOrderSortBy)
    ? (value as AdminOrderSortBy)
    : undefined;
}

function parseSortDir(value: string): AdminOrderSortDir | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

export default function AdminOrdersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersContent({ searchParams }: Props) {
  const sp = await searchParams;
  const orderNumber = pick(sp.orderNumber);
  const customer = pick(sp.customer);
  const phone = pick(sp.phone);
  const userId = pick(sp.userId);
  const status = pick(sp.status);
  const paymentStatus = pick(sp.paymentStatus);
  const sortBy = pick(sp.sortBy);
  const sortDir = pick(sp.sortDir);
  const page = Number(pick(sp.page)) || 1;

  const filters = {
    orderNumber,
    customer,
    phone,
    userId,
    status,
    paymentStatus,
    sortBy,
    sortDir,
  };

  const data = await getOrdersAdmin({
    orderNumber: orderNumber || undefined,
    customer: customer || undefined,
    phone: phone || undefined,
    userId: userId || undefined,
    status: (status as OrderStatus) || undefined,
    paymentStatus: (paymentStatus as PaymentStatus) || undefined,
    sortBy: parseSortBy(sortBy),
    sortDir: parseSortDir(sortDir),
    page,
    perPage: 20,
  });

  return (
    <div>
      <PageHeader
        title="سفارشات و فاکتورها"
        description={`تعداد ${formatNumberFa(data.total)} سفارش`}
      />

      <OrdersTable items={data.items} filters={filters} />

      {data.pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-5">
          {Array.from({ length: data.pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildOrdersHref(filters, p)}
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

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
