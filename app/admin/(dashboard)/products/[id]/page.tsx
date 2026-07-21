import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductAdminById } from "@/actions/products";
import { getCategoriesAdmin } from "@/actions/categories";
import { getPartsBrandsAdmin, getCarModelsAdmin } from "@/actions/brands";
import { PageHeader } from "@/src/components/admin/AdminUI";
import ProductForm from "@/src/components/admin/ProductForm";

export const metadata: Metadata = { title: "ویرایش محصول | پنل مدیریت" };

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: Props) {
  return (
    <Suspense fallback={<EditProductSkeleton />}>
      <EditProductContent params={params} />
    </Suspense>
  );
}

async function EditProductContent({ params }: Props) {
  const { id } = await params;
  const [product, categories, partsBrands, carModels] = await Promise.all([
    getProductAdminById(id),
    getCategoriesAdmin(),
    getPartsBrandsAdmin(),
    getCarModelsAdmin(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <PageHeader title="ویرایش محصول" description={product.name} />
      <ProductForm
        initial={product}
        categories={categories}
        partsBrands={partsBrands}
        carModels={carModels}
      />
    </div>
  );
}

function EditProductSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
