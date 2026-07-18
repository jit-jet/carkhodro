/**
 * Auth-gated admin shell. `proxy.ts` already bounces signed-out visitors away
 * optimistically (cookie presence only); this is the authoritative check —
 * it also confirms the session actually belongs to an ADMIN, not just any
 * cookie value, and redirects to `/admin/login` otherwise.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/src/lib/admin-session";
import AdminShell from "@/src/components/admin/AdminShell";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}

async function AdminGuard({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return <AdminShell adminName={`${admin.firstName} ${admin.lastName}`.trim()}>{children}</AdminShell>;
}

function AdminShellFallback() {
  return <div className="min-h-screen bg-silver-light animate-pulse" />;
}
