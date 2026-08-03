"use client";

import { useState, useTransition } from "react";
import { createFaq, updateFaq, deleteFaq, type FaqInput } from "@/actions/admin-faq";
import type { FaqVM } from "@/src/lib/serializers";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormError,
  Input,
  Textarea,
} from "@/src/components/admin/AdminUI";
import AdminPagination from "@/src/components/admin/AdminPagination";
import { useClientPagination } from "@/src/hooks/useClientPagination";
import { useCartUI } from "@/src/store/cart-ui";

const EMPTY_FORM: FaqInput = { question: "", answer: "", sortOrder: 0 };

export default function FaqManager({ initialFaqs }: { initialFaqs: FaqVM[] }) {
  const notify = useCartUI((s) => s.notify);
  const [faqs, setFaqs] = useState(initialFaqs);
  const [form, setForm] = useState<FaqInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const pagination = useClientPagination(faqs, { resetKey: String(faqs.length) });

  function reset() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      if (editingId) {
        const result = await updateFaq(editingId, form);
        if (!result.ok) {
          setError(result.error);
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        setFaqs((prev) =>
          prev.map((f) => (f.id === editingId ? { ...f, question: form.question, answer: form.answer } : f)),
        );
        notify({
          variant: "success",
          title: "ذخیره موفق",
          description: "سوال با موفقیت به‌روزرسانی شد.",
        });
      } else {
        const result = await createFaq(form);
        if (!result.ok) {
          setError(result.error);
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        setFaqs((prev) => [
          ...prev,
          { id: result.data.id, question: form.question, answer: form.answer, sortOrder: form.sortOrder ?? 0 },
        ]);
        notify({
          variant: "success",
          title: "ذخیره موفق",
          description: "سوال با موفقیت افزوده شد.",
        });
      }
      reset();
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteFaq(id);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      notify({
        variant: "success",
        title: "حذف موفق",
        description: "سوال با موفقیت حذف شد.",
      });
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title={editingId ? "ویرایش سوال" : "افزودن سوال متداول"} />
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="سوال"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
            />
            <Textarea
              placeholder="پاسخ"
              rows={3}
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {editingId ? "ذخیره" : "افزودن"}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={reset}>
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

      <Card className="overflow-hidden">
        <CardHeader title="لیست سوالات" description={`${faqs.length.toLocaleString("fa-IR")} مورد`} />
        {faqs.length === 0 ? (
          <EmptyState message="هنوز سوالی ثبت نشده است." />
        ) : (
          <ul className="divide-y divide-gray-100 px-5 sm:px-6">
            {pagination.items.map((f) => (
              <li key={f.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-charcoal">{f.question}</p>
                    <p className="text-sm text-gray-500 mt-1 leading-6">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(f.id);
                        setForm({ question: f.question, answer: f.answer });
                      }}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(f.id)}
                      disabled={pending}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {faqs.length > 0 && (
        <AdminPagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          total={pagination.total}
          perPage={pagination.perPage}
          onPageChange={pagination.setPage}
          onPerPageChange={pagination.setPerPage}
        />
      )}
    </div>
  );
}
