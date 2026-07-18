import type { Metadata } from "next";
import { getCategories } from "@/actions/categories";
import { PageHeader } from "@/src/components/admin/AdminUI";
import CategoriesManager from "@/src/components/admin/CategoriesManager";

export const metadata: Metadata = { title: "دسته‌بندی‌ها | پنل مدیریت" };

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <PageHeader title="دسته‌بندی‌ها" description="مدیریت دسته‌بندی محصولات فروشگاه" />
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
