"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input, Select } from "@/src/components/admin/AdminUI";
import { USER_ROLE_FA } from "@/src/lib/user-labels";
import { ASSIGNABLE_ROLES } from "@/src/lib/admin-options";

export default function UsersFilterBar({ search, role }: { search: string; role: string }) {
  const router = useRouter();
  const [q, setQ] = useState(search);

  function pushQuery(patch: Record<string, string>) {
    const next = { search: q, role, ...patch };
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.role) params.set("role", next.role);
    const qs = params.toString();
    router.push(qs ? `/admin/users?${qs}` : "/admin/users");
  }

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          pushQuery({ search: q });
        }}
        className="flex gap-2 sm:col-span-2"
      >
        <Input placeholder="جستجو بر اساس نام، موبایل یا نام فروشگاه…" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <Select value={role} onChange={(e) => pushQuery({ role: e.target.value })}>
        <option value="">همه نقش‌ها</option>
        {ASSIGNABLE_ROLES.map((r) => (
          <option key={r} value={r}>
            {USER_ROLE_FA[r]}
          </option>
        ))}
      </Select>
    </div>
  );
}
