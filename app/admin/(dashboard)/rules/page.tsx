import { Suspense } from "react";
import type { Metadata } from "next";
import { getRulesContent } from "@/actions/admin-rules";
import { PageHeader } from "@/src/components/admin/AdminUI";
import RulesForm from "@/src/components/admin/RulesForm";

export const metadata: Metadata = { title: "قوانین و مقررات | پنل مدیریت" };

export default function AdminRulesPage() {
  return (
    <div>
      <PageHeader
        title="قوانین و مقررات"
        description="ویرایش محتوای صفحه قوانین و مقررات فروشگاه"
      />
      <Suspense fallback={<RulesSkeleton />}>
        <AdminRulesContent />
      </Suspense>
    </div>
  );
}

async function AdminRulesContent() {
  const content = await getRulesContent();
  return <RulesForm initial={content} />;
}

function RulesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
