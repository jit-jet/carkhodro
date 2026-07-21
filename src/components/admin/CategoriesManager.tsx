"use client";

import { useState, useTransition } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryInput,
} from "@/actions/admin-categories";
import type { CategoryVM } from "@/src/lib/serializers";
import {
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

const EMPTY_FORM: CategoryInput = { key: "", name: "", image: "", sortOrder: 0 };

export default function CategoriesManager({ initialCategories }: { initialCategories: CategoryVM[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState<CategoryInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function startEdit(c: CategoryVM) {
    setEditingId(c.id);
    setForm({ key: c.key, name: c.name, image: c.image, sortOrder: 0 });
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
      if (editingId) {
        const result = await updateCategory(editingId, form);
        if (!result.ok) return setError(result.error);
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? { ...c, key: form.key, name: form.name, image: form.image || c.image }
              : c,
          ),
        );
        cancelEdit();
      } else {
        const result = await createCategory(form);
        if (!result.ok) return setError(result.error);
        setCategories((prev) => [
          ...prev,
          { id: result.data.id, key: form.key, name: form.name, image: form.image || "/logo.png", count: 0 },
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
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-4 gap-3">
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
            <Input
              placeholder="آدرس تصویر (اختیاری)"
              value={form.image ?? ""}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
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
                نام
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                کلید
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
                <td className="px-4 py-3 font-semibold text-charcoal">{c.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono">{c.key}</td>
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
