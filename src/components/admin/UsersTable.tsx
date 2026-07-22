"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  setUserActive,
  type AdminUserListItemVM,
  type AdminUserSortBy,
  type AdminUserSortDir,
} from "@/actions/admin-users";
import { USER_ROLE_FA } from "@/src/lib/user-labels";
import { ASSIGNABLE_ROLES } from "@/src/lib/admin-options";
import { buildUsersHref, type UsersTableFilters } from "@/src/lib/admin-users-query";
import { buildOrdersHref } from "@/src/lib/admin-orders-query";
import { useCartUI } from "@/src/store/cart-ui";
import {
  Badge,
  Button,
  Input,
  Select,
  TableShell,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
} from "@/src/components/admin/AdminUI";
import { formatToman, noFormatNumberFa } from "@/src/lib/format";

function SortButton({
  label,
  column,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string;
  column: AdminUserSortBy;
  sortBy: string;
  sortDir: string;
  onSort: (column: AdminUserSortBy) => void;
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

export default function UsersTable({
  items,
  filters,
}: {
  items: AdminUserListItemVM[];
  filters: UsersTableFilters;
}) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const [pending, startTransition] = useTransition();
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [phoneDraft, setPhoneDraft] = useState(filters.phone);

  function pushFilters(patch: Partial<UsersTableFilters>) {
    router.push(buildUsersHref({ ...filters, ...patch }));
  }

  function toggleSort(column: AdminUserSortBy) {
    const nextDir: AdminUserSortDir =
      filters.sortBy === column && filters.sortDir === "asc" ? "desc" : "asc";
    pushFilters({ sortBy: column, sortDir: nextDir });
  }

  function handleToggleActive(id: string, next: boolean) {
    startTransition(async () => {
      const result = await setUserActive(id, next);
      if (!result.ok) {
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: next ? "کاربر فعال شد" : "کاربر غیرفعال شد",
        description: next
          ? "کاربر می‌تواند وارد حساب شود."
          : "ورود این کاربر مسدود شد.",
      });
      router.refresh();
    });
  }

  const headerSelectClass = "!py-1.5 !text-xs !rounded-lg min-w-[120px]";

  return (
    <TableShell minWidth="min-w-[1040px]">
          <thead className={tableHeadClass}>
            <tr>
              <th className="text-right px-4 py-3 align-bottom">
                <div className="flex flex-col gap-1.5 items-stretch">
                  <SortButton
                    label="کاربر"
                    column="name"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      pushFilters({ search: searchDraft.trim() });
                    }}
                  >
                    <Input
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                      placeholder="جستجو…"
                      className="!py-1.5 !text-xs !rounded-lg"
                    />
                  </form>
                </div>
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <div className="flex flex-col gap-1.5 items-stretch">
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
                      className="!py-1.5 !text-xs !rounded-lg"
                      dir="ltr"
                    />
                  </form>
                </div>
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <div className="flex flex-col gap-1.5">
                  <SortButton
                    label="نقش فعلی"
                    column="role"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                  <Select
                    value={filters.role}
                    onChange={(e) => pushFilters({ role: e.target.value })}
                    className={headerSelectClass}
                  >
                    <option value="">همه</option>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {USER_ROLE_FA[r]}
                      </option>
                    ))}
                  </Select>
                </div>
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-gray-500">وضعیت</span>
                  <Select
                    value={filters.status}
                    onChange={(e) => pushFilters({ status: e.target.value })}
                    className={headerSelectClass}
                  >
                    <option value="">همه</option>
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                  </Select>
                </div>
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <SortButton
                  label="سفارشات"
                  column="orders"
                  sortBy={filters.sortBy}
                  sortDir={filters.sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="text-right px-4 py-3 align-bottom whitespace-nowrap">
                <span className="font-semibold text-gray-500">نمایش سفارشات</span>
              </th>
              <th className="text-right px-4 py-3 align-bottom">
                <SortButton
                  label="مانده حساب"
                  column="balance"
                  sortBy={filters.sortBy}
                  sortDir={filters.sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  کاربری با این فیلترها یافت نشد.
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className={tableRowClass}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-charcoal">{u.fullName || "—"}</p>
                    {u.shopName && <p className="text-xs text-gray-400">{u.shopName}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600 text-right" dir="ltr">
                    {u.phoneNumber}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="warning">{u.roleLabel}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.isActive ? "success" : "default"}>
                      {u.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{noFormatNumberFa(u.ordersCount)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={buildOrdersHref({
                        orderNumber: "",
                        customer: "",
                        phone: "",
                        status: "",
                        paymentStatus: "",
                        userId: u.id,
                        sortBy: "",
                        sortDir: "",
                      })}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-charcoal hover:bg-silver-light transition-colors whitespace-nowrap"
                    >
                      مشاهده سفارشات
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatToman(u.accountBalanceToman)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleToggleActive(u.id, !u.isActive)}
                      >
                        {u.isActive ? "غیرفعال" : "فعال"}
                      </Button>
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-charcoal hover:bg-silver-light transition-colors"
                      >
                        ویرایش
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
    </TableShell>
  );
}
