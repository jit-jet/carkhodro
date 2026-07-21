"use client";

import { useState, useTransition } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryInput,
} from "@/actions/admin-categories";
import type { AdminCategoryVM } from "@/actions/categories";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormError,
  Input,
  TableShell,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
} from "@/src/components/admin/AdminUI";
import ImageUploadField, { AdminThumb } from "@/src/components/admin/ImageUploadField";

const EMPTY_FORM: CategoryInput = {
  key: "",
  name: "",
  image: "",
  sortOrder: 0,
  isActive: true,
};

export default function CategoriesManager({
  initialCategories,
}: {
  initialCategories: AdminCategoryVM[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState<CategoryInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function startEdit(c: AdminCategoryVM) {
    setEditingId(c.id);
    setForm({
      key: c.key,
      name: c.name,
      image: c.image,
      sortOrder: 0,
      isActive: c.isActive,
    });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const payload: CategoryInput = {
        ...form,
        isActive: form.isActive ?? true,
      };
      if (editingId) {
        const result = await updateCategory(editingId, payload);
        if (!result.ok) return setError(result.error);
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  key: payload.key,
                  name: payload.name,
                  image: payload.image || c.image,
                  isActive: payload.isActive ?? true,
                }
              : c,
          ),
        );
        cancelEdit();
      } else {
        const result = await createCategory(payload);
        if (!result.ok) return setError(result.error);
        setCategories((prev) => [
          ...prev,
          {
            id: result.data.id,
            key: payload.key,
            name: payload.name,
            image: payload.image || "/logo.png",
            count: 0,
            isActive: payload.isActive ?? true,
          },
        ]);
        setForm(EMPTY_FORM);
      }
    });
  }

  function handleDelete(id: number) {
    setRowError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.ok) {
        setRowError({ id, message: result.error });
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title={editingId ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"} />
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Input
                placeholder="کلید (engine)"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                required
              />
              <Input
                placeholder="نام نمایشی"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={pending} className="flex-1">
                  {editingId ? "ذخیره" : "افزودن"}
                </Button>
                {editingId && (
                  <Button type="button" variant="ghost" onClick={cancelEdit}>
                    انصراف
                  </Button>
                )}
              </div>
            </div>
            <ImageUploadField
              folder="categories"
              label="تصویر دسته‌بندی"
              value={form.image ?? ""}
              onChange={(url) => setForm({ ...form, image: url })}
            />
            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-accent"
              />
              فعال (نمایش در فروشگاه)
            </label>
          </form>
          {error && (
            <div className="mt-3">
              <FormError message={error} />
            </div>
          )}
        </div>
      </Card>

      {categories.length === 0 ? (
        <Card>
          <EmptyState message="هنوز دسته‌بندی‌ای ثبت نشده است." />
        </Card>
      ) : (
        <TableShell>
          <thead className={tableHeadClass}>
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                تصویر
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                نام
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                کلید
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                وضعیت
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                تعداد محصول
              </th>
              <th className="text-right px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {categories.map((c) => (
              <tr key={c.id} className={tableRowClass}>
                <td className="px-4 py-3">
                  <AdminThumb src={c.image} alt={c.name} />
                </td>
                <td className="px-4 py-3 font-semibold text-charcoal">{c.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono">{c.key}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.isActive ? "success" : "warning"}>
                    {c.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.count.toLocaleString("fa-IR")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(c)}>
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(c.id)}
                      disabled={pending}
                    >
                      حذف
                    </Button>
                  </div>
                  {rowError?.id === c.id && (
                    <p className="text-xs text-red-600 mt-1 text-left">{rowError.message}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
