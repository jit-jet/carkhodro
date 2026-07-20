"use client";

import { useState, useTransition } from "react";
import {
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
  reorderSocialLinks,
  type SocialLinkInput,
} from "@/actions/admin-social-links";
import type { AdminSocialLinkVM } from "@/src/lib/serializers";
import { SocialMediaIcon, SOCIAL_ICON_PRESETS } from "@/src/components/layout/SocialMediaIcon";
import { Badge, Button, Card, EmptyState, FormError, Input, Label } from "@/src/components/admin/AdminUI";

const EMPTY_FORM: SocialLinkInput = { label: "", url: "", icon: "telegram", isActive: true };

function sortLinks(links: AdminSocialLinkVM[]): AdminSocialLinkVM[] {
  return [...links].sort((a, b) => a.order - b.order);
}

export default function SocialLinksManager({ initialLinks }: { initialLinks: AdminSocialLinkVM[] }) {
  const [links, setLinks] = useState(() => sortLinks(initialLinks));
  const [form, setForm] = useState<SocialLinkInput>(EMPTY_FORM);
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
        const result = await updateSocialLink(editingId, form);
        if (!result.ok) return setError(result.error);
        setLinks((prev) =>
          sortLinks(
            prev.map((link) =>
              link.id === editingId
                ? {
                    ...link,
                    label: form.label,
                    url: form.url,
                    icon: form.icon,
                    isActive: form.isActive ?? true,
                  }
                : link,
            ),
          ),
        );
      } else {
        const result = await createSocialLink(form);
        if (!result.ok) return setError(result.error);
        const nextOrder = links.length > 0 ? Math.max(...links.map((l) => l.order)) + 1 : 0;
        setLinks((prev) =>
          sortLinks([
            ...prev,
            {
              id: result.data.id,
              label: form.label,
              url: form.url,
              icon: form.icon,
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
      const result = await deleteSocialLink(id);
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
      const result = await reorderSocialLinks(orderedIds);
      if (!result.ok) {
        setError(result.error);
        setLinks(previous);
      }
    });
  }

  const sortedLinks = sortLinks(links);

  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6">
        <h3 className="font-bold text-charcoal mb-1">{editingId ? "ویرایش شبکه اجتماعی" : "افزودن شبکه اجتماعی"}</h3>
        <p className="text-sm text-gray-500 mb-4">لینک‌ها در فوتر و صفحه تماس با ما نمایش داده می‌شوند.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>عنوان</Label>
              <Input
                placeholder="مثلاً اینستاگرام"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>آدرس لینک</Label>
              <Input
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                required
                dir="ltr"
                className="text-left"
              />
            </div>
          </div>

          <div>
            <Label>آیکون</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {SOCIAL_ICON_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  title={preset.label}
                  onClick={() => setForm({ ...form, icon: preset.key, label: form.label || preset.label })}
                  className={[
                    "w-10 h-10 rounded-xl border flex items-center justify-center transition-colors",
                    form.icon === preset.key
                      ? "border-accent bg-amber-50 ring-2 ring-accent/30"
                      : "border-gray-200 hover:border-accent/50 hover:bg-silver-light",
                  ].join(" ")}
                >
                  <SocialMediaIcon icon={preset.key} size="md" />
                </button>
              ))}
            </div>
            <Input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="کلید آیکون (telegram, instagram, …) یا ایموجی"
              required
              dir="ltr"
              className="max-w-xs text-left"
            />
          </div>

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
          <EmptyState message="هنوز شبکه اجتماعی ثبت نشده است." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {sortedLinks.map((link, index) => (
              <li key={link.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-silver-light flex items-center justify-center">
                      <SocialMediaIcon icon={link.icon} size="md" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-charcoal">{link.label}</p>
                        {!link.isActive && <Badge tone="warning">غیرفعال</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 font-mono truncate" dir="ltr">
                        {link.url}
                      </p>
                    </div>
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
                        setForm({
                          label: link.label,
                          url: link.url,
                          icon: link.icon,
                          isActive: link.isActive,
                        });
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
