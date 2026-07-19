"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateOrderStatusAdmin,
  type AdminOrderListItemVM,
  type AdminOrderSortBy,
  type AdminOrderSortDir,
} from "@/actions/admin-orders";
import {
  ORDER_STATUS_FA,
  ORDER_STATUS_ORDER,
  ORDER_STATUS_STYLE,
  PAYMENT_STATUS_FA,
} from "@/src/lib/order-labels";
import { buildOrdersHref, type OrdersTableFilters } from "@/src/lib/admin-orders-query";
import { Input, Select } from "@/src/components/admin/AdminUI";
import { formatToman, noFormatNumberFa } from "@/src/lib/format";
import { useCartUI } from "@/src/store/cart-ui";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma_client";

function SortButton({
  label,
  column,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string;
  column: AdminOrderSortBy;
  sortBy: string;
  sortDir: string;
  onSort: (column: AdminOrderSortBy) => void;
}) {
  const active = sortBy === column;
  const arrow = !active ? "↕" : sortDir === "asc" ? "↑" : "↓";
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={[
        "inline-flex items-center gap-1 font-semibold whitespace-nowrap",
        active ? "text-charcoal" : "text-gray-500 hover:text-charcoal",
      ].join(" ")}
    >
      {label}
      <span className="text-[10px] opacity-70">{arrow}</span>
    </button>
  );
}

export default function OrdersTable({
  items,
  filters,
}: {
  items: AdminOrderListItemVM[];
  filters: OrdersTableFilters;
}) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const [orderNumberDraft, setOrderNumberDraft] = useState(filters.orderNumber);
  const [customerDraft, setCustomerDraft] = useState(filters.customer);
  const [phoneDraft, setPhoneDraft] = useState(filters.phone);
  const [rowStatus, setRowStatus] = useState<Record<string, OrderStatus>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pushFilters(patch: Partial<OrdersTableFilters>) {
    router.push(buildOrdersHref({ ...filters, ...patch }));
  }

  function toggleSort(column: AdminOrderSortBy) {
    const nextDir: AdminOrderSortDir =
      filters.sortBy === column && filters.sortDir === "asc" ? "desc" : "asc";
    pushFilters({ sortBy: column, sortDir: nextDir });
  }

  function handleStatusChange(orderId: string, status: OrderStatus) {
    setRowStatus((prev) => ({ ...prev, [orderId]: status }));
    setPendingId(orderId);
    startTransition(async () => {
      const result = await updateOrderStatusAdmin(orderId, status);
      setPendingId(null);
      if (!result.ok) {
        notify({ variant: "error", title: "خطا", description: result.error });
        setRowStatus((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        return;
      }
      notify({
        variant: "success",
        title: "وضعیت به‌روزرسانی شد",
        description: ORDER_STATUS_FA[status],
      });
      router.refresh();
    });
  }

  const headerControl = "!py-1.5 !text-xs !rounded-lg min-w-[110px]";

  return (
    <div className="space-y-3">
      {filters.userId ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-sm">
          <p className="text-charcoal">
            نمایش سفارشات یک کاربر خاص
          </p>
          <Link
            href={buildOrdersHref({ ...filters, userId: "" })}
            className="shrink-0 text-xs font-semibold text-accent-dark hover:underline"
          >
            حذف فیلتر کاربر
          </Link>
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-silver-light text-gray-500">
            <tr>
              <th className="text-right px-4 py-3 align-bottom">
                <div className="flex flex-col gap-1.5">
                  <SortButton
                    label="شماره فاکتور"
                    column="orderNumber"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      pushFilters({ orderNumber: orderNumberDraft.trim() });
                    }}
                  >
                    <Input
                      value={orderNumberDraft}
                      onChange={(e) => setOrderNumberDraft(e.target.value)}
                      placeholder="جستجو…"
                      className={headerControl}
                      dir="ltr"
                    />
                  </form>
                </div>
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <div className="flex flex-col gap-1.5">
                  <SortButton
                    label="مشتری"
                    column="customer"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      pushFilters({ customer: customerDraft.trim() });
                    }}
                  >
                    <Input
                      value={customerDraft}
                      onChange={(e) => setCustomerDraft(e.target.value)}
                      placeholder="جستجو…"
                      className={headerControl}
                    />
                  </form>
                </div>
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <div className="flex flex-col gap-1.5">
                  <SortButton
                    label="موبایل"
                    column="phone"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      pushFilters({ phone: phoneDraft.trim() });
                    }}
                  >
                    <Input
                      value={phoneDraft}
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      placeholder="جستجو…"
                      className={headerControl}
                      dir="ltr"
                    />
                  </form>
                </div>
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <div className="flex flex-col gap-1.5">
                  <SortButton
                    label="وضعیت"
                    column="status"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                  <Select
                    value={filters.status}
                    onChange={(e) => pushFilters({ status: e.target.value })}
                    className={headerControl}
                  >
                    <option value="">همه</option>
                    {ORDER_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_FA[s]}
                      </option>
                    ))}
                  </Select>
                </div>
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <div className="flex flex-col gap-1.5">
                  <SortButton
                    label="پرداخت"
                    column="paymentStatus"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                  <Select
                    value={filters.paymentStatus}
                    onChange={(e) => pushFilters({ paymentStatus: e.target.value })}
                    className={headerControl}
                  >
                    <option value="">همه</option>
                    {(Object.keys(PAYMENT_STATUS_FA) as PaymentStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {PAYMENT_STATUS_FA[s]}
                      </option>
                    ))}
                  </Select>
                </div>
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <SortButton
                  label="مبلغ"
                  column="total"
                  sortBy={filters.sortBy}
                  sortDir={filters.sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <SortButton
                  label="تاریخ"
                  column="createdAt"
                  sortBy={filters.sortBy}
                  sortDir={filters.sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  سفارشی با این فیلترها یافت نشد.
                </td>
              </tr>
            ) : (
              items.map((o) => {
                const status = rowStatus[o.id] ?? o.status;
                return (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-charcoal text-right" dir="ltr">
                      #{noFormatNumberFa(o.orderNumber)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-charcoal">{o.customerName}</p>
                      <p className="text-xs text-gray-400">
                        {noFormatNumberFa(o.itemCount)} قلم · {o.paymentMethodLabel}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 text-right" dir="ltr">
                      {o.phoneNumber}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={status}
                        onChange={(e) =>
                          handleStatusChange(o.id, e.target.value as OrderStatus)
                        }
                        disabled={pending && pendingId === o.id}
                        className={[
                          "!py-1.5 !text-xs w-auto min-w-[160px] border",
                          ORDER_STATUS_STYLE[status],
                        ].join(" ")}
                      >
                        {ORDER_STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {ORDER_STATUS_FA[s]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs font-semibold">
                      {o.paymentStatusLabel}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums font-semibold text-charcoal">
                      {formatToman(o.totalToman)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {o.dateFull}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-accent-dark font-semibold hover:underline text-xs whitespace-nowrap"
                      >
                        جزئیات
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
