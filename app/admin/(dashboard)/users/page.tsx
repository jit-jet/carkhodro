import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getUsersAdmin,
  type AdminUserSortBy,
  type AdminUserSortDir,
} from "@/actions/admin-users";
import { PageHeader } from "@/src/components/admin/AdminUI";
import UsersTable from "@/src/components/admin/UsersTable";
import { buildUsersHref } from "@/src/lib/admin-users-query";
import { formatNumberFa } from "@/src/lib/format";
import type { UserRole } from "@/generated/prisma_client";

export const metadata: Metadata = { title: "کاربران | پنل مدیریت" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const SORT_BY_VALUES: AdminUserSortBy[] = [
  "name",
  "phone",
  "role",
  "orders",
  "balance",
  "createdAt",
];

function pick(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parseSortBy(value: string): AdminUserSortBy | undefined {
  return SORT_BY_VALUES.includes(value as AdminUserSortBy)
    ? (value as AdminUserSortBy)
    : undefined;
}

function parseSortDir(value: string): AdminUserSortDir | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

export default function AdminUsersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<UsersSkeleton />}>
      <UsersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function UsersContent({ searchParams }: Props) {
  const sp = await searchParams;
  const search = pick(sp.search);
  const phone = pick(sp.phone);
  const role = pick(sp.role) as UserRole | "";
  const statusRaw = pick(sp.status);
  const status =
    statusRaw === "active" || statusRaw === "inactive" ? statusRaw : "";
  const sortBy = pick(sp.sortBy);
  const sortDir = pick(sp.sortDir);
  const page = Number(pick(sp.page)) || 1;

  const filters = { search, phone, role, status, sortBy, sortDir };

  const data = await getUsersAdmin({
    search: search || undefined,
    phone: phone || undefined,
    role: role || undefined,
    status: status || undefined,
    sortBy: parseSortBy(sortBy),
    sortDir: parseSortDir(sortDir),
    page,
    perPage: 20,
  });

  return (
    <div>
      <PageHeader title="مدیریت کاربران" description={`تعداد ${formatNumberFa(data.total)} کاربر`} />

      <UsersTable items={data.items} filters={filters} />

      {data.pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-5">
          {Array.from({ length: data.pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildUsersHref(filters, p)}
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

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
