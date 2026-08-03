"use client";

import { useState, useTransition } from "react";
import {
  createFooterLink,
  updateFooterLink,
  deleteFooterLink,
  reorderFooterLinks,
  type FooterLinkInput,
} from "@/actions/admin-footer-links";
import type { AdminFooterLinkVM, FooterLinkGroupVM } from "@/src/lib/serializers";
import { Badge, Button, Card, CardHeader, EmptyState, FormError, Input } from "@/src/components/admin/AdminUI";
import AdminPagination from "@/src/components/admin/AdminPagination";
import { useClientPagination } from "@/src/hooks/useClientPagination";
import { useCartUI } from "@/src/store/cart-ui";

function sortLinks(links: AdminFooterLinkVM[]): AdminFooterLinkVM[] {
  return [...links].sort((a, b) => a.order - b.order);
}

export default function FooterLinksManager({
  group,
  title,
  description,
  initialLinks,
}: {
  group: FooterLinkGroupVM;
  title: string;
  description?: string;
  initialLinks: AdminFooterLinkVM[];
}) {
  const notify = useCartUI((s) => s.notify);
  const [links, setLinks] = useState(() => sortLinks(initialLinks));
  const [form, setForm] = useState<Omit<FooterLinkInput, "group">>({
    href: "",
    label: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setEditingId(null);
    setForm({ href: "", label: "", isActive: true });
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      if (editingId) {
        const result = await updateFooterLink(editingId, { ...form, group });
        if (!result.ok) {
          setError(result.error);
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        setLinks((prev) =>
          sortLinks(
            prev.map((link) =>
              link.id === editingId
                ? {
                    ...link,
                    href: form.href,
                    label: form.label,
                    isActive: form.isActive ?? true,
                  }
                : link,
            ),
          ),
        );
        notify({
          variant: "success",
          title: "ذخیره موفق",
          description: "لینک فوتر با موفقیت به‌روزرسانی شد.",
        });
      } else {
        const result = await createFooterLink({ ...form, group });
        if (!result.ok) {
          setError(result.error);
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        const nextOrder = links.length > 0 ? Math.max(...links.map((l) => l.order)) + 1 : 0;
        setLinks((prev) =>
          sortLinks([
            ...prev,
            {
              id: result.data.id,
              group,
              href: form.href,
              label: form.label,
              order: nextOrder,
              isActive: form.isActive ?? true,
            },
          ]),
        );
        notify({
          variant: "success",
          title: "ذخیره موفق",
          description: "لینک فوتر با موفقیت افزوده شد.",
        });
      }
      reset();
    });
  }

  function handleDelete(id: number) {
    setError("");
    startTransition(async () => {
      const result = await deleteFooterLink(id);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setLinks((prev) => prev.filter((link) => link.id !== id));
      notify({
        variant: "success",
        title: "حذف موفق",
        description: "لینک فوتر با موفقیت حذف شد.",
      });
    });
  }

  function moveLink(id: number, direction: "up" | "down") {
    setError("");
    const sorted = sortLinks(links);
    const index = sorted.findIndex((link) => link.id === id);
    if (index === -1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const orderedIds = reordered.map((link) => link.id);
    const optimistic = reordered.map((link, i) => ({ ...link, order: i }));
    const previous = sorted;

    setLinks(optimistic);
    startTransition(async () => {
      const result = await reorderFooterLinks(group, orderedIds);
      if (!result.ok) {
        setError(result.error);
        setLinks(previous);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: "ترتیب به‌روز شد",
        description: "ترتیب لینک‌های فوتر ذخیره شد.",
      });
    });
  }

  const sortedLinks = sortLinks(links);
  const pagination = useClientPagination(sortedLinks, {
    resetKey: String(sortedLinks.length),
  });
  const pageStart = (pagination.page - 1) * pagination.perPage;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title={editingId ? "ویرایش لینک" : `افزودن به ${title}`} />
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="عنوان (مثلاً صفحه اصلی)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />
            <Input
              placeholder="آدرس (مثلاً /products یا /products?category=engine)"
              value={form.href}
              onChange={(e) => setForm({ ...form, href: e.target.value })}
              required
              dir="ltr"
              className="text-left"
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
        <CardHeader
          title={title}
          description={description ?? "با فلش‌ها ترتیب نمایش را تغییر دهید"}
        />
        {sortedLinks.length === 0 ? (
          <EmptyState message="هنوز لینکی ثبت نشده است." />
        ) : (
          <ul className="divide-y divide-gray-100 px-5 sm:px-6">
            {pagination.items.map((link, index) => {
              const globalIndex = pageStart + index;
              return (
                <li key={link.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-charcoal">{link.label}</p>
                        {!link.isActive && <Badge tone="warning">غیرفعال</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 font-mono" dir="ltr">
                        {link.href}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveLink(link.id, "up")}
                        disabled={pending || globalIndex === 0}
                        title="انتقال به بالا"
                        className="p-2 rounded-lg text-gray-500 hover:bg-silver-light disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="انتقال به بالا"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLink(link.id, "down")}
                        disabled={pending || globalIndex === sortedLinks.length - 1}
                        title="انتقال به پایین"
                        className="p-2 rounded-lg text-gray-500 hover:bg-silver-light disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="انتقال به پایین"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(link.id);
                          setForm({
                            href: link.href,
                            label: link.label,
                            isActive: link.isActive,
                          });
                          setError("");
                        }}
                      >
                        ویرایش
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(link.id)}
                        disabled={pending}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {sortedLinks.length > 0 && (
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
