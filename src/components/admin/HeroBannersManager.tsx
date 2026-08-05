"use client";

import { useState, useTransition } from "react";
import {
  createHeroBanner,
  updateHeroBanner,
  updateHeroContent,
  deleteHeroBanner,
  reorderHeroBanners,
  type HeroBannerInput,
  type HeroContentInput,
} from "@/actions/admin-hero-banners";
import type { AdminHeroBannerVM, HeroContentVM } from "@/src/lib/serializers";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormError,
  Input,
  Label,
  Textarea,
} from "@/src/components/admin/AdminUI";
import ImageUploadField, { AdminThumb } from "@/src/components/admin/ImageUploadField";
import AdminPagination from "@/src/components/admin/AdminPagination";
import { useClientPagination } from "@/src/hooks/useClientPagination";
import { useCartUI } from "@/src/store/cart-ui";

const EMPTY_SLIDE: HeroBannerInput = { imageUrl: "", isActive: true };

function sortBanners(banners: AdminHeroBannerVM[]): AdminHeroBannerVM[] {
  return [...banners].sort((a, b) => a.order - b.order);
}

export default function HeroBannersManager({
  initialContent,
  initialBanners,
}: {
  initialContent: HeroContentVM;
  initialBanners: AdminHeroBannerVM[];
}) {
  const notify = useCartUI((s) => s.notify);
  const [content, setContent] = useState<HeroContentInput>(initialContent);
  const [contentError, setContentError] = useState("");
  const [banners, setBanners] = useState(() => sortBanners(initialBanners));
  const [slideForm, setSlideForm] = useState<HeroBannerInput>(EMPTY_SLIDE);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [slideError, setSlideError] = useState("");
  const [pending, startTransition] = useTransition();

  function resetSlide() {
    setEditingId(null);
    setSlideForm(EMPTY_SLIDE);
    setSlideError("");
  }

  function handleContentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContentError("");
    startTransition(async () => {
      const result = await updateHeroContent(content);
      if (!result.ok) {
        setContentError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: "ذخیره موفق",
        description: "متن و دکمه‌های هیرو ذخیره شد.",
      });
    });
  }

  function handleSlideSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSlideError("");
    startTransition(async () => {
      if (editingId) {
        const result = await updateHeroBanner(editingId, slideForm);
        if (!result.ok) {
          setSlideError(result.error);
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        setBanners((prev) =>
          sortBanners(
            prev.map((banner) =>
              banner.id === editingId
                ? {
                    ...banner,
                    imageUrl: slideForm.imageUrl,
                    isActive: slideForm.isActive ?? true,
                  }
                : banner,
            ),
          ),
        );
        notify({
          variant: "success",
          title: "ذخیره موفق",
          description: "تصویر بنر به‌روزرسانی شد.",
        });
      } else {
        const result = await createHeroBanner(slideForm);
        if (!result.ok) {
          setSlideError(result.error);
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        const nextOrder =
          banners.length > 0 ? Math.max(...banners.map((b) => b.order)) + 1 : 0;
        setBanners((prev) =>
          sortBanners([
            ...prev,
            {
              id: result.data.id,
              imageUrl: slideForm.imageUrl,
              order: nextOrder,
              isActive: slideForm.isActive ?? true,
            },
          ]),
        );
        notify({
          variant: "success",
          title: "ذخیره موفق",
          description: "تصویر بنر افزوده شد.",
        });
      }
      resetSlide();
    });
  }

  function handleDelete(id: number) {
    setSlideError("");
    startTransition(async () => {
      const result = await deleteHeroBanner(id);
      if (!result.ok) {
        setSlideError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setBanners((prev) => prev.filter((banner) => banner.id !== id));
      if (editingId === id) resetSlide();
      notify({
        variant: "success",
        title: "حذف موفق",
        description: "تصویر بنر حذف شد.",
      });
    });
  }

  function moveBanner(id: number, direction: "up" | "down") {
    setSlideError("");
    const sorted = sortBanners(banners);
    const index = sorted.findIndex((banner) => banner.id === id);
    if (index === -1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const orderedIds = reordered.map((banner) => banner.id);
    const optimistic = reordered.map((banner, i) => ({ ...banner, order: i }));
    const previous = sorted;

    setBanners(optimistic);
    startTransition(async () => {
      const result = await reorderHeroBanners(orderedIds);
      if (!result.ok) {
        setSlideError(result.error);
        setBanners(previous);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: "ترتیب به‌روز شد",
        description: "ترتیب تصاویر هیرو ذخیره شد.",
      });
    });
  }

  const sortedBanners = sortBanners(banners);
  const pagination = useClientPagination(sortedBanners, {
    resetKey: String(sortedBanners.length),
  });
  const pageStart = (pagination.page - 1) * pagination.perPage;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader
          title="متن و دکمه‌های هیرو"
          description="این محتوا ثابت است و با تغییر تصویر اسلاید عوض نمی‌شود."
        />
        <div className="p-5 sm:p-6">
          <form onSubmit={handleContentSubmit} className="space-y-4">
            <div>
              <Label>عنوان</Label>
              <Input
                placeholder="عنوان هیرو"
                value={content.title}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>توضیحات</Label>
              <Textarea
                value={content.description}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                required
                rows={3}
                placeholder="توضیح کوتاه زیر عنوان"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>متن دکمه اول</Label>
                <Input
                  value={content.button1Text}
                  onChange={(e) => setContent({ ...content, button1Text: e.target.value })}
                  required
                  placeholder="مثلاً مشاهده محصولات"
                />
              </div>
              <div>
                <Label>لینک دکمه اول</Label>
                <Input
                  value={content.button1Href}
                  onChange={(e) => setContent({ ...content, button1Href: e.target.value })}
                  required
                  dir="ltr"
                  className="text-left"
                  placeholder="/products یا https://…"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>متن دکمه دوم (اختیاری)</Label>
                <Input
                  value={content.button2Text}
                  onChange={(e) => setContent({ ...content, button2Text: e.target.value })}
                  placeholder="مثلاً جستجو بر اساس خودرو"
                />
              </div>
              <div>
                <Label>لینک دکمه دوم (اختیاری)</Label>
                <Input
                  value={content.button2Href}
                  onChange={(e) => setContent({ ...content, button2Href: e.target.value })}
                  dir="ltr"
                  className="text-left"
                  placeholder="/products یا https://…"
                />
              </div>
            </div>

            <Button type="submit" disabled={pending}>
              ذخیره متن هیرو
            </Button>
          </form>
          {contentError && (
            <div className="mt-3">
              <FormError message={contentError} />
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title={editingId ? "ویرایش تصویر" : "افزودن تصویر اسلایدر"}
          description="در صورت وجود بیش از یک تصویر فعال، اسلایدر با پخش خودکار نمایش داده می‌شود."
        />
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSlideSubmit} className="space-y-4">
            <ImageUploadField
              folder="banners"
              value={slideForm.imageUrl}
              onChange={(url) => setSlideForm({ ...slideForm, imageUrl: url })}
              label="تصویر"
            />

            <label className="inline-flex items-center gap-2 text-sm text-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={slideForm.isActive ?? true}
                onChange={(e) => setSlideForm({ ...slideForm, isActive: e.target.checked })}
                className="w-4 h-4 accent-accent"
              />
              فعال در صفحه اصلی
            </label>

            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {editingId ? "ذخیره تصویر" : "افزودن تصویر"}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetSlide}>
                  انصراف
                </Button>
              )}
            </div>
          </form>
          {slideError && (
            <div className="mt-3">
              <FormError message={slideError} />
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="تصاویر اسلایدر" />
        {sortedBanners.length === 0 ? (
          <EmptyState message="هنوز تصویری ثبت نشده است." />
        ) : (
          <ul className="divide-y divide-gray-100 px-5 sm:px-6">
            {pagination.items.map((banner, index) => {
              const globalIndex = pageStart + index;
              return (
                <li key={banner.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <AdminThumb src={banner.imageUrl} alt={`اسلاید ${globalIndex + 1}`} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-charcoal">
                            تصویر {globalIndex + 1}
                          </p>
                          {!banner.isActive && <Badge tone="warning">غیرفعال</Badge>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 truncate" dir="ltr">
                          {banner.imageUrl}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveBanner(banner.id, "up")}
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
                        onClick={() => moveBanner(banner.id, "down")}
                        disabled={pending || globalIndex === sortedBanners.length - 1}
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
                          setEditingId(banner.id);
                          setSlideForm({
                            imageUrl: banner.imageUrl,
                            isActive: banner.isActive,
                          });
                          setSlideError("");
                        }}
                      >
                        ویرایش
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(banner.id)}
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

      {sortedBanners.length > 0 && (
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
