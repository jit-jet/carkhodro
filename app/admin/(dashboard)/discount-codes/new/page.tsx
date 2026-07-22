import type { Metadata } from "next";
import Link from "next/link";
import { getCategoriesAdmin } from "@/actions/categories";
import {
  getPartsBrandsAdmin,
  getCarBrandsAdmin,
  getCarModelsAdmin,
} from "@/actions/brands";
import { PageHeader } from "@/src/components/admin/AdminUI";
import DiscountCodeForm from "@/src/components/admin/DiscountCodeForm";

export const metadata: Metadata = { title: "افزودن کد تخفیف | پنل مدیریت" };

export default async function NewDiscountCodePage() {
  const [categories, partsBrands, carBrands, carModels] = await Promise.all([
    getCategoriesAdmin(),
    getPartsBrandsAdmin(),
    getCarBrandsAdmin(),
    getCarModelsAdmin(),
  ]);

  const now = new Date();
  now.setSeconds(0, 0);

  return (
    <div>
      <PageHeader
        title="افزودن کد تخفیف"
        description="نوع، محدوده اعمال و محدودیت‌های استفاده را تنظیم کنید"
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
        initial={{
          code: "",
          type: "PERCENTAGE",
          value: null,
          startsAt: now.toISOString(),
          endsAt: null,
          scopeType: "BRAND",
          scopeIds: [],
          scopeLabels: [],
          perCustomerLimit: null,
          totalUsageLimit: null,
          minCartAmount: null,
          maxDiscountAmount: null,
          firstOrderOnly: false,
          minPreviousOrders: null,
          isActive: true,
        }}
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
