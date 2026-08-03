import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getUsersAdmin,
  type AdminUserSortBy,
  type AdminUserSortDir,
} from "@/actions/admin-users";
import { PageHeader } from "@/src/components/admin/AdminUI";
import AdminPagination from "@/src/components/admin/AdminPagination";
import UsersTable from "@/src/components/admin/UsersTable";
import { parsePage, parsePerPage, pickSearchParam } from "@/src/lib/admin-pagination";
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
  const search = pickSearchParam(sp.search);
  const phone = pickSearchParam(sp.phone);
  const role = pickSearchParam(sp.role) as UserRole | "";
  const statusRaw = pickSearchParam(sp.status);
  const status =
    statusRaw === "active" || statusRaw === "inactive" ? statusRaw : "";
  const sortBy = pickSearchParam(sp.sortBy);
  const sortDir = pickSearchParam(sp.sortDir);
  const page = parsePage(sp.page);
  const perPage = parsePerPage(sp.perPage);

  const filters = { search, phone, role, status, sortBy, sortDir, perPage };

  const data = await getUsersAdmin({
    search: search || undefined,
    phone: phone || undefined,
    role: role || undefined,
    status: status || undefined,
    sortBy: parseSortBy(sortBy),
    sortDir: parseSortDir(sortDir),
    page,
    perPage,
  });

  return (
    <div>
      <PageHeader title="مدیریت کاربران" description={`تعداد ${formatNumberFa(data.total)} کاربر`} />

      <UsersTable items={data.items} filters={filters} />

      <AdminPagination
        page={data.page}
        pageCount={data.pageCount}
        total={data.total}
        perPage={data.perPage}
        pathname="/admin/users"
        query={{
          ...(search ? { search } : {}),
          ...(phone ? { phone } : {}),
          ...(role ? { role } : {}),
          ...(status ? { status } : {}),
          ...(sortBy ? { sortBy } : {}),
          ...(sortDir ? { sortDir } : {}),
        }}
      />
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
