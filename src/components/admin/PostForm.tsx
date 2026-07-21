"use client";

/**
 * Create/edit blog post form — content, cover, category, publish state, SEO/OG.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, type PostInput } from "@/actions/admin-posts";
import {
  Button,
  Card,
  CardHeader,
  Input,
  Label,
  Select,
  Textarea,
} from "@/src/components/admin/AdminUI";
import ImageUploadField from "@/src/components/admin/ImageUploadField";
import RichTextEditor from "@/src/components/admin/RichTextEditor";
import { useCartUI } from "@/src/store/cart-ui";

export interface PostFormInitial extends PostInput {
  id?: number;
}

export default function PostForm({
  initial,
  categories,
}: {
  initial: PostFormInitial;
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const isEditing = Boolean(initial.id);

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [body, setBody] = useState(initial.body);
  const [coverImage, setCoverImage] = useState(initial.coverImage);
  const [author, setAuthor] = useState(initial.author);
  const [tagsText, setTagsText] = useState(initial.tags.join("، "));
  const [readTime, setReadTime] = useState(String(initial.readTime || 5));
  const [publishedAt, setPublishedAt] = useState(initial.publishedAt);
  const [isPublished, setIsPublished] = useState(initial.isPublished);
  const [categoryId, setCategoryId] = useState<number | "">(
    initial.categoryId ?? "",
  );
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initial.metaDescription ?? "",
  );
  const [metaKeywords, setMetaKeywords] = useState(initial.metaKeywords ?? "");
  const [ogTitle, setOgTitle] = useState(initial.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(
    initial.ogDescription ?? "",
  );
  const [ogImage, setOgImage] = useState(initial.ogImage ?? "");

  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(isEditing);

  function parseTags(raw: string): string[] {
    return raw
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function buildPayload(): PostInput {
    return {
      title,
      slug,
      excerpt,
      body,
      coverImage,
      author,
      tags: parseTags(tagsText),
      readTime: Number(readTime) || 1,
      publishedAt,
      isPublished,
      categoryId: categoryId === "" ? null : Number(categoryId),
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImage: ogImage || null,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload();
    startTransition(async () => {
      if (isEditing && initial.id) {
        const result = await updatePost(initial.id, payload);
        if (!result.ok) {
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        notify({
          variant: "success",
          title: "ذخیره موفق",
          description: "مقاله با موفقیت ذخیره شد.",
        });
        router.refresh();
      } else {
        const result = await createPost(payload);
        if (!result.ok) {
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        notify({
          variant: "success",
          title: "ایجاد موفق",
          description: "مقاله با موفقیت ایجاد شد.",
        });
        router.push(`/admin/posts/${result.data.id}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <CardHeader title="محتوای مقاله" description="عنوان، اسلاگ، خلاصه و متن اصلی" />
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>عنوان</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) {
                    setSlug(
                      e.target.value
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-_]/g, "")
                        .replace(/-+/g, "-"),
                    );
                  }
                }}
                required
              />
            </div>
            <div>
              <Label>اسلاگ (انگلیسی)</Label>
              <Input
                id="post-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                dir="ltr"
                className="font-mono text-sm"
                required
              />
            </div>
          </div>

          <div>
            <Label>خلاصه</Label>
            <Textarea
              id="post-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div>
            <Label>متن مقاله</Label>
            <RichTextEditor value={body} onChange={setBody} />
            <p className="text-xs text-gray-400 mt-1.5">
              متن فارسی را بنویسید؛ خروجی به‌صورت HTML ذخیره می‌شود.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="تصویر و انتشار" />
        <div className="p-5 sm:p-6 space-y-4">
          <ImageUploadField
            folder="posts"
            value={coverImage}
            onChange={setCoverImage}
            label="تصویر شاخص"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>نویسنده</Label>
              <Input
                id="post-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>زمان مطالعه (دقیقه)</Label>
              <Input
                id="post-read-time"
                type="number"
                min={1}
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>تاریخ انتشار</Label>
              <Input
                id="post-published-at"
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>دسته‌بندی</Label>
              <Select
                id="post-category"
                value={categoryId === "" ? "" : String(categoryId)}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">بدون دسته</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>برچسب‌ها</Label>
              <Input
                id="post-tags"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="نگهداری، موتور، DIY"
              />
              <p className="text-xs text-gray-400 mt-1">با کاما یا ، جدا کنید</p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-gray-300 text-accent focus:ring-accent"
            />
            منتشر شده (نمایش در وبلاگ)
          </label>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="سئو و Open Graph"
          description="در صورت خالی بودن، از عنوان و خلاصه مقاله استفاده می‌شود"
        />
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Meta Title</Label>
              <Input
                id="meta-title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Meta Keywords</Label>
              <Input
                id="meta-keywords"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="روغن موتور، نگهداری خودرو"
              />
            </div>
          </div>
          <div>
            <Label>Meta Description</Label>
            <Textarea
              id="meta-description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>OG Title</Label>
              <Input
                id="og-title"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>OG Description</Label>
              <Input
                id="og-description"
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
              />
            </div>
          </div>
          <ImageUploadField
            folder="posts"
            value={ogImage}
            onChange={setOgImage}
            label="OG Image (اختیاری — در غیر این صورت تصویر شاخص)"
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "در حال ذخیره…" : isEditing ? "ذخیره تغییرات" : "ایجاد مقاله"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/posts")}
          disabled={pending}
        >
          بازگشت به لیست
        </Button>
      </div>
    </form>
  );
}
