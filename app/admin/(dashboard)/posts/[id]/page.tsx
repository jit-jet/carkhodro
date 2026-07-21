import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostAdminById } from "@/actions/posts";
import { getPostCategoriesAdmin } from "@/actions/post-categories";
import { PageHeader } from "@/src/components/admin/AdminUI";
import PostForm from "@/src/components/admin/PostForm";

export const metadata: Metadata = { title: "ویرایش مقاله | پنل مدیریت" };

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: Props) {
  return (
    <Suspense fallback={<EditPostSkeleton />}>
      <EditPostContent params={params} />
    </Suspense>
  );
}

async function EditPostContent({ params }: Props) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isFinite(postId)) notFound();

  const [post, categories] = await Promise.all([
    getPostAdminById(postId),
    getPostCategoriesAdmin(),
  ]);

  if (!post) notFound();

  return (
    <div>
      <PageHeader title="ویرایش مقاله" description={post.title} />
      <PostForm
        initial={post}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}

function EditPostSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
