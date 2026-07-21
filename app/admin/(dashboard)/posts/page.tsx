import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostsAdmin } from "@/actions/posts";
import { getPostCategoriesAdmin } from "@/actions/post-categories";
import { PageHeader, Button } from "@/src/components/admin/AdminUI";
import PostsTable from "@/src/components/admin/PostsTable";
import { formatNumberFa } from "@/src/lib/format";

export const metadata: Metadata = { title: "مقالات وبلاگ | پنل مدیریت" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pick(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
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
  const search = pick(sp.search);
  const statusRaw = pick(sp.status);
  const status =
    statusRaw === "published" || statusRaw === "draft" ? statusRaw : "all";
  const categoryId = pick(sp.categoryId);
  const page = Number(pick(sp.page)) || 1;

  const [data, categories] = await Promise.all([
    getPostsAdmin({
      search: search || undefined,
      status,
      categoryId: categoryId ? Number(categoryId) : undefined,
      page,
      perPage: 20,
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
        filters={{ search, status, categoryId }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />

      {data.pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-5">
          {Array.from({ length: data.pageCount }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (status !== "all") params.set("status", status);
            if (categoryId) params.set("categoryId", categoryId);
            params.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/admin/posts?${params.toString()}`}
                className={[
                  "min-w-9 h-9 px-2 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                  p === data.page
                    ? "bg-accent text-charcoal"
                    : "bg-white border border-gray-200 text-charcoal hover:bg-silver-light",
                ].join(" ")}
              >
                {p.toLocaleString("fa-IR")}
              </Link>
            );
          })}
        </div>
      )}
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
