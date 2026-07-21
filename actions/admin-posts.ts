'use server';

/**
 * Blog post mutation Server Actions — admin panel.
 * Split from `actions/posts.ts` so Client Components can import writes without
 * pulling that file's `use cache` reads into the browser bundle.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { normalizeSlug } from '@/src/lib/slug';
import { tags } from '@/actions/cache-tags';

export interface PostInput {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  author: string;
  tags: string[];
  readTime: number;
  publishedAt: string; // ISO date or datetime string
  isPublished: boolean;
  categoryId?: number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
}

function parseTags(tagsInput: string[] | undefined): string[] {
  if (!tagsInput) return [];
  return tagsInput
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i);
}

function parsePublishedAt(value: string): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

function validatePost(input: PostInput): string | null {
  if (!input.title?.trim()) return 'عنوان مقاله الزامی است.';
  if (!normalizeSlug(input.slug ?? '')) {
    return 'اسلاگ الزامی است (فقط حروف انگلیسی، عدد و خط تیره).';
  }
  if (!input.excerpt?.trim()) return 'خلاصه مقاله الزامی است.';
  if (!input.body?.trim()) return 'متن مقاله الزامی است.';
  if (!input.coverImage?.trim()) return 'تصویر شاخص الزامی است.';
  if (!input.author?.trim()) return 'نام نویسنده الزامی است.';
  if (!Number.isFinite(input.readTime) || input.readTime < 1) {
    return 'زمان مطالعه باید حداقل ۱ دقیقه باشد.';
  }
  if (!parsePublishedAt(input.publishedAt)) {
    return 'تاریخ انتشار نامعتبر است.';
  }
  return null;
}

function toPostData(input: PostInput) {
  return {
    slug: normalizeSlug(input.slug),
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    body: input.body.trim(),
    coverImage: input.coverImage.trim(),
    author: input.author.trim(),
    tags: parseTags(input.tags),
    readTime: Math.round(input.readTime),
    publishedAt: parsePublishedAt(input.publishedAt)!,
    isPublished: input.isPublished ?? true,
    categoryId: input.categoryId ?? null,
    metaTitle: input.metaTitle?.trim() || null,
    metaDescription: input.metaDescription?.trim() || null,
    metaKeywords: input.metaKeywords?.trim() || null,
    ogTitle: input.ogTitle?.trim() || null,
    ogDescription: input.ogDescription?.trim() || null,
    ogImage: input.ogImage?.trim() || null,
  };
}

export async function createPost(
  input: PostInput,
): Promise<ActionResult<{ id: number; slug: string }>> {
  return runMutation('createPost', async () => {
    const err = validatePost(input);
    if (err) return fail(err);

    const data = toPostData(input);
    const existing = await prisma.post.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (existing) return fail('اسلاگ تکراری است. اسلاگ دیگری انتخاب کنید.');

    if (data.categoryId != null) {
      const cat = await prisma.postCategory.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });
      if (!cat) return fail('دسته‌بندی انتخاب‌شده یافت نشد.');
    }

    const created = await prisma.post.create({
      data,
      select: { id: true, slug: true },
    });
    updateTag(tags.posts);
    updateTag(tags.post(created.slug));
    updateTag(tags.postCategories);
    return ok(created);
  });
}

export async function updatePost(
  id: number,
  input: PostInput,
): Promise<ActionResult<{ id: number; slug: string }>> {
  return runMutation('updatePost', async () => {
    const err = validatePost(input);
    if (err) return fail(err);

    const existing = await prisma.post.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) return fail('مقاله یافت نشد.');

    const data = toPostData(input);
    if (data.slug !== existing.slug) {
      const clash = await prisma.post.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });
      if (clash) return fail('اسلاگ تکراری است. اسلاگ دیگری انتخاب کنید.');
    }

    if (data.categoryId != null) {
      const cat = await prisma.postCategory.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });
      if (!cat) return fail('دسته‌بندی انتخاب‌شده یافت نشد.');
    }

    const updated = await prisma.post.update({
      where: { id },
      data,
      select: { id: true, slug: true },
    });
    updateTag(tags.posts);
    updateTag(tags.post(existing.slug));
    if (updated.slug !== existing.slug) updateTag(tags.post(updated.slug));
    updateTag(tags.postCategories);
    return ok(updated);
  });
}

export async function setPostPublished(
  id: number,
  isPublished: boolean,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('setPostPublished', async () => {
    const updated = await prisma.post.update({
      where: { id },
      data: { isPublished },
      select: { id: true, slug: true },
    });
    updateTag(tags.posts);
    updateTag(tags.post(updated.slug));
    return ok({ id: updated.id });
  });
}

export async function deletePost(id: number): Promise<ActionResult> {
  return runMutation('deletePost', async () => {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!existing) return fail('مقاله یافت نشد.');
    await prisma.post.delete({ where: { id } });
    updateTag(tags.posts);
    updateTag(tags.post(existing.slug));
    updateTag(tags.postCategories);
    return ok(undefined);
  });
}
