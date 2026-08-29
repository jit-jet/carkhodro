import type { Metadata } from "next";
import { getCategoriesAdmin } from "@/actions/categories";
import { getPartsBrandsAdmin, getCarModelsAdmin } from "@/actions/brands";
import { PageHeader } from "@/src/components/admin/AdminUI";
import ProductForm from "@/src/components/admin/ProductForm";

export const metadata: Metadata = { title: "محصول جدید | پنل مدیریت" };

export default async function NewProductPage() {
  const [categories, partsBrands, carModels] = await Promise.all([
    getCategoriesAdmin(),
    getPartsBrandsAdmin(),
    getCarModelsAdmin(),
  ]);

  return (
    <div>
      <PageHeader title="افزودن محصول جدید" description="اطلاعات و قیمت‌گذاری محصول را وارد کنید" />
      <ProductForm
        initial={{
          sku: "",
          name: "",
          partsBrandId: partsBrands[0]?.id ?? 0,
          categoryId: categories[0]?.id ?? 0,
          carModelIds: [],
          wholesalePrice: 0,
          buyPrice: null,
          wholesaleDiscountPct: 0,
          retailPriceDiffPct: 25,
          retailDiscountPct: 0,
          origin: "",
          unit: "عدد",
          mainImage: "",
          images: [],
          description: "",
          isOffer: false,
          callForPriceRetail: false,
          callForPriceWholesale: false,
        }}
        categories={categories}
        partsBrands={partsBrands}
        carModels={carModels}
      />
    </div>
  );
}
