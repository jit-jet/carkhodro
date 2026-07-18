"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, type AdminUserListItemVM } from "@/actions/admin-users";
import { USER_ROLE_FA } from "@/src/lib/user-labels";
import { ASSIGNABLE_ROLES } from "@/src/lib/admin-options";
import { Button, Select } from "@/src/components/admin/AdminUI";
import { formatToman, noFormatNumberFa } from "@/src/lib/format";
import type { UserRole } from "@/generated/prisma_client";

export default function UsersTable({ items }: { items: AdminUserListItemVM[] }) {
  const router = useRouter();
  const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave(userId: string) {
    const role = pendingRoles[userId];
    if (!role) return;
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (!result.ok) {
        setError({ id: userId, message: result.error });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="bg-silver-light text-gray-500">
            <tr>
              <th className="text-right px-4 py-3 font-semibold">کاربر</th>
              <th className="text-right px-4 py-3 font-semibold">موبایل</th>
              <th className="text-right px-4 py-3 font-semibold">نقش فعلی</th>
              <th className="text-right px-4 py-3 font-semibold">سفارشات</th>
              <th className="text-right px-4 py-3 font-semibold">مانده حساب</th>
              <th className="text-right px-4 py-3 font-semibold">تغییر نقش</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((u) => {
              const selectedRole = pendingRoles[u.id] ?? u.role;
              const dirty = selectedRole !== u.role;
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-charcoal">{u.fullName || "—"}</p>
                    {u.shopName && <p className="text-xs text-gray-400">{u.shopName}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600" dir="ltr">
                    {u.phoneNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-accent-dark">
                      {u.roleLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{noFormatNumberFa(u.ordersCount)}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatToman(u.accountBalanceToman)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedRole}
                        onChange={(e) =>
                          setPendingRoles((prev) => ({ ...prev, [u.id]: e.target.value as UserRole }))
                        }
                        className="!py-1.5 !text-xs w-auto min-w-[110px]"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {USER_ROLE_FA[r]}
                          </option>
                        ))}
                      </Select>
                      <Button
                        type="button"
                        onClick={() => handleSave(u.id)}
                        disabled={!dirty || pending}
                        className="!py-1.5 !px-3 text-xs"
                      >
                        ذخیره
                      </Button>
                    </div>
                    {error?.id === u.id && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
