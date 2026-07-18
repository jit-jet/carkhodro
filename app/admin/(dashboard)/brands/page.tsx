import { Suspense } from "react";
import type { Metadata } from "next";
import { getCarBrandsAdmin, getCarModelsAdmin, getPartsBrands } from "@/actions/brands";
import { PageHeader } from "@/src/components/admin/AdminUI";
import BrandsManager from "@/src/components/admin/BrandsManager";

export const metadata: Metadata = { title: "برندها و خودروها | پنل مدیریت" };

export default function AdminBrandsPage() {
  return (
    <div>
      <PageHeader title="برندها و خودروها" description="مدیریت برند خودرو، مدل خودرو و برند قطعات" />
      <Suspense fallback={<BrandsSkeleton />}>
        <AdminBrandsContent />
      </Suspense>
    </div>
  );
}

async function AdminBrandsContent() {
  const [carBrands, carModels, partsBrands] = await Promise.all([
    getCarBrandsAdmin(),
    getCarModelsAdmin(),
    getPartsBrands(),
  ]);

  return (
    <BrandsManager
      initialCarBrands={carBrands}
      initialCarModels={carModels}
      initialPartsBrands={partsBrands}
    />
  );
}

function BrandsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-72 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
