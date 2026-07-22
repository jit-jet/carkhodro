"use client";

/**
 * Admin list table for redeemable discount codes («کد تخفیف»).
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteDiscountCode,
  setDiscountCodeActive,
} from "@/actions/admin-discount-codes";
import type { AdminDiscountCodeListItemVM } from "@/actions/discount-codes";
import type { DiscountType } from "@/generated/prisma_client";
import {
  Badge,
  Button,
  Input,
  Select,
  TableShell,
  Toolbar,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
} from "@/src/components/admin/AdminUI";
import { formatJalaliDateTime, formatNumberFa, formatToman } from "@/src/lib/format";
import { useCartUI } from "@/src/store/cart-ui";

const TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: "درصدی",
  FIXED_AMOUNT: "مبلغی",
  FREE_SHIPPING: "ارسال رایگان",
};

function buildHref(filters: {
  search: string;
  status: string;
  type: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const q = params.toString();
  return q ? `/admin/discount-codes?${q}` : "/admin/discount-codes";
}

function formatValue(type: DiscountType, value: number | null): string {
  if (type === "FREE_SHIPPING") return "—";
  if (value == null) return "—";
  if (type === "PERCENTAGE") return `${formatNumberFa(value)}٪`;
  return formatToman(value);
}

export default function DiscountCodesTable({
  items,
  total,
  filters,
}: {
  items: AdminDiscountCodeListItemVM[];
  total: number;
  filters: { search: string; status: string; type: string };
}) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const [search, setSearch] = useState(filters.search);
  const [status, setStatus] = useState(filters.status || "all");
  const [type, setType] = useState(filters.type || "all");
  const [pending, startTransition] = useTransition();

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    router.push(buildHref({ search, status, type, page: 1 }));
  }

  function handleToggle(id: string, next: boolean) {
    startTransition(async () => {
      const result = await setDiscountCodeActive(id, next);
      if (!result.ok) {
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: next ? "فعال شد" : "غیرفعال شد",
        description: next
          ? "کد تخفیف برای استفاده فعال است."
          : "کد تخفیف غیرفعال شد.",
      });
      router.refresh();
    });
  }

  function handleDelete(id: string, code: string) {
    if (!window.confirm(`کد تخفیف «${code}» حذف شود؟ این عمل قابل بازگشت نیست.`)) return;
    startTransition(async () => {
      const result = await deleteDiscountCode(id);
      if (!result.ok) {
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: "حذف شد",
        description: "کد تخفیف با موفقیت حذف شد.",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Toolbar>
        <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3 w-full">
          <div className="min-w-[12rem] flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی کد تخفیف…"
            />
          </div>
          <div className="w-40">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </Select>
          </div>
          <div className="w-44">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">همه انواع</option>
              <option value="PERCENTAGE">درصدی</option>
              <option value="FIXED_AMOUNT">مبلغی</option>
              <option value="FREE_SHIPPING">ارسال رایگان</option>
            </Select>
          </div>
          <Button type="submit">فیلتر</Button>
          <p className="text-xs text-gray-500 self-center">
            {total.toLocaleString("fa-IR")} کد
          </p>
        </form>
      </Toolbar>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-500">
          کد تخفیفی یافت نشد.
        </div>
      ) : (
        <TableShell>
          <thead className={tableHeadClass}>
            <tr>
              <th className="text-right px-4 py-3 font-semibold">کد</th>
              <th className="text-right px-4 py-3 font-semibold">نوع</th>
              <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">مقدار</th>
              <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">اعتبار</th>
              <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">استفاده</th>
              <th className="text-right px-4 py-3 font-semibold">وضعیت</th>
              <th className="text-right px-4 py-3 font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {items.map((row) => (
              <tr key={row.id} className={tableRowClass}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/discount-codes/${row.id}`}
                    className="font-bold text-charcoal hover:text-accent-dark tracking-wide"
                  >
                    {row.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">{TYPE_LABELS[row.type]}</td>
                <td className="px-4 py-3 text-sm hidden sm:table-cell">
                  {formatValue(row.type, row.value)}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">
                  <div>{formatJalaliDateTime(row.startsAt)}</div>
                  {row.endsAt && (
                    <div className="text-gray-400 mt-0.5">تا {formatJalaliDateTime(row.endsAt)}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm hidden md:table-cell">
                  {formatNumberFa(row.usedCount)}
                  {row.totalUsageLimit != null
                    ? ` / ${formatNumberFa(row.totalUsageLimit)}`
                    : " / ∞"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={row.isActive ? "success" : "default"}>
                    {row.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/admin/discount-codes/${row.id}`}>
                      <Button type="button" variant="ghost" size="sm" disabled={pending}>
                        ویرایش
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleToggle(row.id, !row.isActive)}
                    >
                      {row.isActive ? "غیرفعال" : "فعال"}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleDelete(row.id, row.code)}
                    >
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
