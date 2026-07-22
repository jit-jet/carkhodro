import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDiscountCodeAdminById } from "@/actions/discount-codes";
import { getCategoriesAdmin } from "@/actions/categories";
import {
  getPartsBrandsAdmin,
  getCarBrandsAdmin,
  getCarModelsAdmin,
} from "@/actions/brands";
import { PageHeader } from "@/src/components/admin/AdminUI";
import DiscountCodeForm from "@/src/components/admin/DiscountCodeForm";

export const metadata: Metadata = { title: "ویرایش کد تخفیف | پنل مدیریت" };

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditDiscountCodePage({ params }: Props) {
  return (
    <Suspense fallback={<EditSkeleton />}>
      <EditDiscountCodeContent params={params} />
    </Suspense>
  );
}

async function EditDiscountCodeContent({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();

  const [code, categories, partsBrands, carBrands, carModels] = await Promise.all([
    getDiscountCodeAdminById(id),
    getCategoriesAdmin(),
    getPartsBrandsAdmin(),
    getCarBrandsAdmin(),
    getCarModelsAdmin(),
  ]);

  if (!code) notFound();

  return (
    <div>
      <PageHeader
        title="ویرایش کد تخفیف"
        description={code.code}
        action={
          <Link
            href="/admin/discount-codes"
            className="text-sm font-semibold text-gray-500 hover:text-charcoal"
          >
            ← بازگشت
          </Link>
        }
      />
      <DiscountCodeForm
        initial={code}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        partsBrands={partsBrands.map((b) => ({ id: b.id, name: b.name }))}
        carBrands={carBrands.map((b) => ({ id: b.id, name: b.name }))}
        carModels={carModels.map((m) => ({
          id: m.id,
          name: m.name,
          brandName: m.brandName,
        }))}
      />
    </div>
  );
}

function EditSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
