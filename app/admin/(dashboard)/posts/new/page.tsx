import type { Metadata } from "next";
import { getPostCategoriesAdmin } from "@/actions/post-categories";
import { PageHeader } from "@/src/components/admin/AdminUI";
import PostForm from "@/src/components/admin/PostForm";

export const metadata: Metadata = { title: "مقاله جدید | پنل مدیریت" };

export default async function NewPostPage() {
  const categories = await getPostCategoriesAdmin();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title="افزودن مقاله جدید"
        description="محتوا، تصویر شاخص و تنظیمات سئو را وارد کنید"
      />
      <PostForm
        initial={{
          slug: "",
          title: "",
          excerpt: "",
          body: "",
          coverImage: "",
          author: "کارخودرو",
          tags: [],
          readTime: 5,
          publishedAt: today,
          isPublished: false,
          categoryId: null,
          metaTitle: null,
          metaDescription: null,
          metaKeywords: null,
          ogTitle: null,
          ogDescription: null,
          ogImage: null,
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
