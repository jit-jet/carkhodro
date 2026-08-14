import { Suspense } from "react";
import type { Metadata } from "next";
import { getReturnContent } from "@/actions/admin-return-content";
import { PageHeader } from "@/src/components/admin/AdminUI";
import ReturnContentForm from "@/src/components/admin/ReturnContentForm";

export const metadata: Metadata = { title: "شرایط مرجوعی | پنل مدیریت" };

export default function AdminReturnPage() {
  return (
    <div>
      <PageHeader title="شرایط مرجوعی" description="ویرایش محتوای صفحه شرایط مرجوعی کالا" />
      <Suspense fallback={<div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />}>
        <ReturnEditor />
      </Suspense>
    </div>
  );
}

async function ReturnEditor() {
  return <ReturnContentForm initial={await getReturnContent()} />;
}
