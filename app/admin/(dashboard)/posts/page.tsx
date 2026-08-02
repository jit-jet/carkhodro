import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostsAdmin } from "@/actions/posts";
import { getPostCategoriesAdmin } from "@/actions/post-categories";
import { PageHeader, Button } from "@/src/components/admin/AdminUI";
import AdminPagination from "@/src/components/admin/AdminPagination";
import PostsTable from "@/src/components/admin/PostsTable";
import { parsePage, parsePerPage, pickSearchParam } from "@/src/lib/admin-pagination";
import { formatNumberFa } from "@/src/lib/format";

export const metadata: Metadata = { title: "مقالات وبلاگ | پنل مدیریت" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function AdminPostsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<PostsSkeleton />}>
      <PostsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PostsContent({ searchParams }: Props) {
  const sp = await searchParams;
  const search = pickSearchParam(sp.search);
  const statusRaw = pickSearchParam(sp.status);
  const status =
    statusRaw === "published" || statusRaw === "draft" ? statusRaw : "all";
  const categoryId = pickSearchParam(sp.categoryId);
  const page = parsePage(sp.page);
  const perPage = parsePerPage(sp.perPage);

  const filters = { search, status, categoryId, perPage };

  const [data, categories] = await Promise.all([
    getPostsAdmin({
      search: search || undefined,
      status,
      categoryId: categoryId ? Number(categoryId) : undefined,
      page,
      perPage,
    }),
    getPostCategoriesAdmin(),
  ]);

  return (
    <div>
      <PageHeader
        title="مقالات وبلاگ"
        description={`تعداد ${formatNumberFa(data.total)} مقاله`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/post-categories">
              <Button type="button" variant="ghost">
                دسته‌بندی‌ها
              </Button>
            </Link>
            <Link href="/admin/posts/new">
              <Button type="button">+ مقاله جدید</Button>
            </Link>
          </div>
        }
      />

      <PostsTable
        items={data.items}
        total={data.total}
        filters={filters}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />

      <AdminPagination
        page={data.page}
        pageCount={data.pageCount}
        total={data.total}
        perPage={data.perPage}
        pathname="/admin/posts"
        query={{
          ...(search ? { search } : {}),
          ...(status !== "all" ? { status } : {}),
          ...(categoryId ? { categoryId } : {}),
        }}
      />
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
