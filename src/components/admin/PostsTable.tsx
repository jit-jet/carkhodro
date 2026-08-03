"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deletePost, setPostPublished } from "@/actions/admin-posts";
import type { AdminPostListItemVM } from "@/actions/posts";
import {
  Badge,
  Button,
  Input,
  Select,
  TableShell,
  Toolbar,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
} from "@/src/components/admin/AdminUI";
import { AdminThumb } from "@/src/components/admin/ImageUploadField";
import { buildPostsHref, type PostsTableFilters } from "@/src/lib/admin-posts-query";
import { useCartUI } from "@/src/store/cart-ui";

export default function PostsTable({
  items,
  total,
  filters,
  categories,
}: {
  items: AdminPostListItemVM[];
  total: number;
  filters: PostsTableFilters;
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const [search, setSearch] = useState(filters.search);
  const [status, setStatus] = useState(filters.status || "all");
  const [categoryId, setCategoryId] = useState(filters.categoryId);
  const [pending, startTransition] = useTransition();

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    router.push(buildPostsHref({ ...filters, search, status, categoryId }));
  }

  function handleToggle(id: number, next: boolean) {
    startTransition(async () => {
      const result = await setPostPublished(id, next);
      if (!result.ok) {
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: next ? "منتشر شد" : "لغو انتشار",
        description: next
          ? "مقاله در وبلاگ نمایش داده می‌شود."
          : "مقاله از وبلاگ مخفی شد.",
      });
      router.refresh();
    });
  }

  function handleDelete(id: number, title: string) {
    if (!window.confirm(`مقاله «${title}» حذف شود؟ این عمل قابل بازگشت نیست.`)) return;
    startTransition(async () => {
      const result = await deletePost(id);
      if (!result.ok) {
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: "حذف شد",
        description: "مقاله با موفقیت حذف شد.",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Toolbar>
        <form
          onSubmit={applyFilters}
          className="flex flex-wrap items-end gap-3 w-full"
        >
          <div className="min-w-[12rem] flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو عنوان، اسلاگ یا نویسنده…"
            />
          </div>
          <div className="w-40">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">همه وضعیت‌ها</option>
              <option value="published">منتشر شده</option>
              <option value="draft">پیش‌نویس</option>
            </Select>
          </div>
          <div className="w-44">
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">فیلتر</Button>
          <p className="text-xs text-gray-500 self-center">
            {total.toLocaleString("fa-IR")} مقاله
          </p>
        </form>
      </Toolbar>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-500">
          مقاله‌ای یافت نشد.
        </div>
      ) : (
        <TableShell>
          <thead className={tableHeadClass}>
            <tr>
              <th className="text-right px-4 py-3 font-semibold">مقاله</th>
              <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">دسته</th>
              <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">نویسنده</th>
              <th className="text-right px-4 py-3 font-semibold">وضعیت</th>
              <th className="text-right px-4 py-3 font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {items.map((post) => (
              <tr key={post.id} className={tableRowClass}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <AdminThumb src={post.coverImage} alt={post.title} />
                    <div className="min-w-0">
                      <p className="font-bold text-charcoal truncate">{post.title}</p>
                      <p className="text-xs text-gray-400 font-mono truncate dir-ltr" dir="ltr">
                        /{post.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                  {post.categoryName ?? "—"}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                  {post.author}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={post.isPublished ? "success" : "default"}>
                    {post.isPublished ? "منتشر شده" : "پیش‌نویس"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/posts/${post.id}`}>
                      <Button type="button" variant="ghost" size="sm">
                        ویرایش
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleToggle(post.id, !post.isPublished)}
                    >
                      {post.isPublished ? "لغو انتشار" : "انتشار"}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleDelete(post.id, post.title)}
                    >
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
