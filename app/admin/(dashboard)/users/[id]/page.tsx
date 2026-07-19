import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getUserAdminById } from "@/actions/admin-users";
import { getProvinces } from "@/actions/locations";
import { PageHeader } from "@/src/components/admin/AdminUI";
import UserForm from "@/src/components/admin/UserForm";

export const metadata: Metadata = { title: "ویرایش کاربر | پنل مدیریت" };

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: Props) {
  return (
    <Suspense fallback={<EditUserSkeleton />}>
      <EditUserContent params={params} />
    </Suspense>
  );
}

async function EditUserContent({ params }: Props) {
  const { id } = await params;
  const [user, provinces] = await Promise.all([getUserAdminById(id), getProvinces()]);
  if (!user) notFound();

  return (
    <div>
      <PageHeader
        title="ویرایش کاربر"
        description={`${user.firstName} ${user.lastName}`.trim() || user.phoneNumber}
      />
      <UserForm initial={user} provinces={provinces} />
    </div>
  );
}

function EditUserSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
