import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getUsersAdmin } from "@/actions/admin-users";
import { PageHeader } from "@/src/components/admin/AdminUI";
import UsersFilterBar from "@/src/components/admin/UsersFilterBar";
import UsersTable from "@/src/components/admin/UsersTable";
import { formatNumberFa } from "@/src/lib/format";
import type { UserRole } from "@/generated/prisma_client";

export const metadata: Metadata = { title: "کاربران | پنل مدیریت" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pick(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
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
  const role = pick(sp.role) as UserRole | "";
  const page = Number(pick(sp.page)) || 1;

  const data = await getUsersAdmin({ search: search || undefined, role: role || undefined, page, perPage: 20 });

  return (
    <div>
      <PageHeader title="مدیریت کاربران" description={`تعداد ${formatNumberFa(data.total)} کاربر`} />

      <div className="mb-4">
        <UsersFilterBar search={search} role={role} />
      </div>

      {data.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          کاربری با این فیلترها یافت نشد.
        </div>
      ) : (
        <UsersTable items={data.items} />
      )}

      {data.pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-5">
          {Array.from({ length: data.pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p, search, role)}
              className={[
                "min-w-9 h-9 px-2 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                p === data.page ? "bg-accent text-charcoal" : "bg-white border border-gray-200 text-charcoal hover:bg-silver-light",
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

function pageHref(page: number, search: string, role: string): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
