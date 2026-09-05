import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getOrdersAdmin,
  type AdminOrderSortBy,
  type AdminOrderSortDir,
} from "@/actions/admin-orders";
import { PageHeader } from "@/src/components/admin/AdminUI";
import AdminPagination from "@/src/components/admin/AdminPagination";
import OrdersTable from "@/src/components/admin/OrdersTable";
import { parsePage, parsePerPage, pickSearchParam } from "@/src/lib/admin-pagination";
import { formatNumberFa } from "@/src/lib/format";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma_client";
import {
  ORDER_STATUS_ORDER,
  type AdminOrderStatusFilter,
} from "@/src/lib/order-labels";

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

function parseSortBy(value: string): AdminOrderSortBy | undefined {
  return SORT_BY_VALUES.includes(value as AdminOrderSortBy)
    ? (value as AdminOrderSortBy)
    : undefined;
}

function parseSortDir(value: string): AdminOrderSortDir | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function parseStatus(value: string): AdminOrderStatusFilter | undefined {
  if (value === "pending" || ORDER_STATUS_ORDER.includes(value as OrderStatus)) {
    return value as AdminOrderStatusFilter;
  }
  return undefined;
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
  const orderNumber = pickSearchParam(sp.orderNumber);
  const customer = pickSearchParam(sp.customer);
  const phone = pickSearchParam(sp.phone);
  const userId = pickSearchParam(sp.userId);
  const status = parseStatus(pickSearchParam(sp.status)) ?? "";
  const paymentStatus = pickSearchParam(sp.paymentStatus);
  const sortBy = pickSearchParam(sp.sortBy);
  const sortDir = pickSearchParam(sp.sortDir);
  const page = parsePage(sp.page);
  const perPage = parsePerPage(sp.perPage);

  const filters = {
    orderNumber,
    customer,
    phone,
    userId,
    status,
    paymentStatus,
    sortBy,
    sortDir,
    perPage,
  };

  const data = await getOrdersAdmin({
    orderNumber: orderNumber || undefined,
    customer: customer || undefined,
    phone: phone || undefined,
    userId: userId || undefined,
    status: status || undefined,
    paymentStatus: (paymentStatus as PaymentStatus) || undefined,
    sortBy: parseSortBy(sortBy),
    sortDir: parseSortDir(sortDir),
    page,
    perPage,
  });

  return (
    <div>
      <PageHeader
        title="سفارشات و فاکتورها"
        description={`تعداد ${formatNumberFa(data.total)} سفارش`}
      />

      <OrdersTable items={data.items} filters={filters} />

      <AdminPagination
        page={data.page}
        pageCount={data.pageCount}
        total={data.total}
        perPage={data.perPage}
        pathname="/admin/orders"
        query={{
          ...(orderNumber ? { orderNumber } : {}),
          ...(customer ? { customer } : {}),
          ...(phone ? { phone } : {}),
          ...(userId ? { userId } : {}),
          ...(status ? { status } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
          ...(sortBy ? { sortBy } : {}),
          ...(sortDir ? { sortDir } : {}),
        }}
      />
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
