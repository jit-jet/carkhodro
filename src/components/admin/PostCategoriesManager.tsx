"use client";

import { useState, useTransition } from "react";
import {
  createPostCategory,
  updatePostCategory,
  deletePostCategory,
  type PostCategoryInput,
} from "@/actions/admin-post-categories";
import type { PostCategoryVM } from "@/actions/post-categories";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Label,
  TableShell,
  Textarea,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
} from "@/src/components/admin/AdminUI";
import { useCartUI } from "@/src/store/cart-ui";

const EMPTY_FORM: PostCategoryInput = {
  slug: "",
  name: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
  sortOrder: 0,
  isActive: true,
};

export default function PostCategoriesManager({
  initialCategories,
}: {
  initialCategories: PostCategoryVM[];
}) {
  const notify = useCartUI((s) => s.notify);
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState<PostCategoryInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(false);

  function startEdit(c: PostCategoryVM) {
    setEditingId(c.id);
    setSlugTouched(true);
    setForm({
      slug: c.slug,
      name: c.name,
      description: c.description ?? "",
      metaTitle: c.metaTitle ?? "",
      metaDescription: c.metaDescription ?? "",
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setSlugTouched(false);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload: PostCategoryInput = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive ?? true,
      };
      if (editingId) {
        const result = await updatePostCategory(editingId, payload);
        if (!result.ok) {
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  slug: payload.slug,
                  name: payload.name,
                  description: payload.description || null,
                  metaTitle: payload.metaTitle || null,
                  metaDescription: payload.metaDescription || null,
                  sortOrder: payload.sortOrder ?? 0,
                  isActive: payload.isActive ?? true,
                }
              : c,
          ),
        );
        notify({
          variant: "success",
          title: "ذخیره موفق",
          description: "دسته‌بندی با موفقیت به‌روزرسانی شد.",
        });
        cancelEdit();
      } else {
        const result = await createPostCategory(payload);
        if (!result.ok) {
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        setCategories((prev) => [
          ...prev,
          {
            id: result.data.id,
            slug: payload.slug,
            name: payload.name,
            description: payload.description || null,
            metaTitle: payload.metaTitle || null,
            metaDescription: payload.metaDescription || null,
            sortOrder: payload.sortOrder ?? 0,
            isActive: payload.isActive ?? true,
            postCount: 0,
          },
        ]);
        notify({
          variant: "success",
          title: "ایجاد موفق",
          description: "دسته‌بندی با موفقیت افزوده شد.",
        });
        setSlugTouched(false);
        setForm(EMPTY_FORM);
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deletePostCategory(id);
      if (!result.ok) {
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      notify({
        variant: "success",
        title: "حذف شد",
        description: "دسته‌بندی با موفقیت حذف شد.",
      });
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title={editingId ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
          description="دسته‌بندی‌های وبلاگ برای سازمان‌دهی مقالات"
          action={
            editingId ? (
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                انصراف
              </Button>
            ) : null
          }
        />
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>نام</Label>
              <Input
                id="pc-name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: slugTouched
                      ? f.slug
                      : name
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-_]/g, "")
                          .replace(/-+/g, "-"),
                  }));
                }}
                required
              />
            </div>
            <div>
              <Label>اسلاگ</Label>
              <Input
                id="pc-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                dir="ltr"
                className="font-mono text-sm"
                required
              />
            </div>
            <div>
              <Label>ترتیب</Label>
              <Input
                id="pc-sort"
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-accent focus:ring-accent"
                />
                فعال
              </label>
            </div>
          </div>
          <div>
            <Label>توضیحات</Label>
            <Textarea
              id="pc-desc"
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Meta Title</Label>
              <Input
                id="pc-meta-title"
                value={form.metaTitle ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metaTitle: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Meta Description</Label>
              <Input
                id="pc-meta-desc"
                value={form.metaDescription ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metaDescription: e.target.value }))
                }
              />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending
              ? "در حال ذخیره…"
              : editingId
                ? "ذخیره تغییرات"
                : "افزودن دسته‌بندی"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="لیست دسته‌بندی‌ها" />
        {categories.length === 0 ? (
          <EmptyState message="هنوز دسته‌بندی‌ای ثبت نشده" />
        ) : (
          <TableShell>
            <thead className={tableHeadClass}>
              <tr>
                <th className="text-right px-4 py-3 font-semibold">نام</th>
                <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">اسلاگ</th>
                <th className="text-right px-4 py-3 font-semibold">مقالات</th>
                <th className="text-right px-4 py-3 font-semibold">وضعیت</th>
                <th className="text-right px-4 py-3 font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody className={tableBodyClass}>
              {categories.map((c) => (
                <tr key={c.id} className={tableRowClass}>
                  <td className="px-4 py-3 font-bold text-charcoal">{c.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-gray-500" dir="ltr">
                    {c.slug}
                  </td>
                  <td className="px-4 py-3">{c.postCount.toLocaleString("fa-IR")}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.isActive ? "success" : "warning"}>
                      {c.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(c)}
                        >
                          ویرایش
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={pending}
                          onClick={() => handleDelete(c.id)}
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
      </Card>
    </div>
  );
}
