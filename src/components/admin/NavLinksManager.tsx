"use client";

import { useState, useTransition } from "react";
import {
  createNavLink,
  updateNavLink,
  deleteNavLink,
  reorderNavLinks,
  type NavLinkInput,
} from "@/actions/admin-navigation";
import type { AdminNavLinkVM } from "@/src/lib/serializers";
import { Badge, Button, Card, EmptyState, FormError, Input } from "@/src/components/admin/AdminUI";

const EMPTY_FORM: NavLinkInput = { href: "", label: "", isActive: true };

function sortLinks(links: AdminNavLinkVM[]): AdminNavLinkVM[] {
  return [...links].sort((a, b) => a.order - b.order);
}

export default function NavLinksManager({ initialLinks }: { initialLinks: AdminNavLinkVM[] }) {
  const [links, setLinks] = useState(() => sortLinks(initialLinks));
  const [form, setForm] = useState<NavLinkInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

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
        const result = await updateNavLink(editingId, form);
        if (!result.ok) return setError(result.error);
        setLinks((prev) =>
          sortLinks(
            prev.map((link) =>
              link.id === editingId
                ? { ...link, href: form.href, label: form.label, isActive: form.isActive ?? true }
                : link,
            ),
          ),
        );
      } else {
        const result = await createNavLink(form);
        if (!result.ok) return setError(result.error);
        const nextOrder = links.length > 0 ? Math.max(...links.map((l) => l.order)) + 1 : 0;
        setLinks((prev) =>
          sortLinks([
            ...prev,
            {
              id: result.data.id,
              href: form.href,
              label: form.label,
              order: nextOrder,
              isActive: form.isActive ?? true,
            },
          ]),
        );
      }
      reset();
    });
  }

  function handleDelete(id: number) {
    setError("");
    startTransition(async () => {
      const result = await deleteNavLink(id);
      if (!result.ok) return setError(result.error);
      setLinks((prev) => prev.filter((link) => link.id !== id));
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
      const result = await reorderNavLinks(orderedIds);
      if (!result.ok) {
        setError(result.error);
        setLinks(previous);
      }
    });
  }

  const sortedLinks = sortLinks(links);

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <h2 className="font-bold text-charcoal mb-4">{editingId ? "ویرایش لینک" : "افزودن لینک منو"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="عنوان (مثلاً محصولات)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
          />
          <Input
            placeholder="آدرس (مثلاً /products)"
            value={form.href}
            onChange={(e) => setForm({ ...form, href: e.target.value })}
            required
            dir="ltr"
            className="text-left"
          />
          {/* <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-300 text-accent focus:ring-accent/30"
            />
            نمایش در منوی سایت
          </label> */}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>{editingId ? "ذخیره" : "افزودن"}</Button>
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
      </Card>

      <Card className="p-5 sm:p-6">
        {sortedLinks.length === 0 ? (
          <EmptyState message="هنوز لینکی ثبت نشده است." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {sortedLinks.map((link, index) => (
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
                      disabled={pending || index === 0}
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
                      disabled={pending || index === sortedLinks.length - 1}
                      title="انتقال به پایین"
                      className="p-2 rounded-lg text-gray-500 hover:bg-silver-light disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="انتقال به پایین"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(link.id);
                        setForm({ href: link.href, label: link.label, isActive: link.isActive });
                        setError("");
                      }}
                      className="px-2 py-1 text-accent-dark font-semibold hover:underline text-sm"
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(link.id)}
                      disabled={pending}
                      className="px-2 py-1 text-red-600 font-semibold hover:underline text-sm disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
