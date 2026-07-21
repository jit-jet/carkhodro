import type { Metadata } from "next";
import Link from "next/link";
import { getPostCategoriesAdmin } from "@/actions/post-categories";
import { PageHeader, Button } from "@/src/components/admin/AdminUI";
import PostCategoriesManager from "@/src/components/admin/PostCategoriesManager";

export const metadata: Metadata = { title: "دسته‌بندی وبلاگ | پنل مدیریت" };

export default async function AdminPostCategoriesPage() {
  const categories = await getPostCategoriesAdmin();

  return (
    <div>
      <PageHeader
        title="دسته‌بندی مقالات"
        description="سازمان‌دهی مقالات وبلاگ بر اساس دسته‌بندی"
        action={
          <Link href="/admin/posts">
            <Button type="button" variant="ghost">
              بازگشت به مقالات
            </Button>
          </Link>
        }
      />
      <PostCategoriesManager initialCategories={categories} />
    </div>
  );
}
