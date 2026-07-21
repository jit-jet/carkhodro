'use server';

/**
 * Post-category mutation Server Actions — admin panel.
 * Split from public reads so Client Components can import writes safely.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { normalizeSlug } from '@/src/lib/slug';
import { tags } from '@/actions/cache-tags';

export interface PostCategoryInput {
  slug: string;
  name: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createPostCategory(
  input: PostCategoryInput,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('createPostCategory', async () => {
    if (!input.name?.trim()) return fail('نام دسته‌بندی الزامی است.');
    const slug = normalizeSlug(input.slug ?? '');
    if (!slug) return fail('اسلاگ الزامی است (فقط حروف انگلیسی، عدد و خط تیره).');

    const created = await prisma.postCategory.create({
      data: {
        slug,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        metaTitle: input.metaTitle?.trim() || null,
        metaDescription: input.metaDescription?.trim() || null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      },
      select: { id: true },
    });
    updateTag(tags.postCategories);
    updateTag(tags.posts);
    return ok(created);
  });
}

export async function updatePostCategory(
  id: number,
  input: Partial<PostCategoryInput>,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('updatePostCategory', async () => {
    let slug: string | undefined;
    if (input.slug !== undefined) {
      slug = normalizeSlug(input.slug);
      if (!slug) return fail('اسلاگ الزامی است (فقط حروف انگلیسی، عدد و خط تیره).');
    }

    const updated = await prisma.postCategory.update({
      where: { id },
      data: {
        ...(slug !== undefined ? { slug } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.metaTitle !== undefined
          ? { metaTitle: input.metaTitle?.trim() || null }
          : {}),
        ...(input.metaDescription !== undefined
          ? { metaDescription: input.metaDescription?.trim() || null }
          : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: { id: true },
    });
    updateTag(tags.postCategories);
    updateTag(tags.posts);
    return ok(updated);
  });
}

export async function deletePostCategory(id: number): Promise<ActionResult> {
  return runMutation('deletePostCategory', async () => {
    const postCount = await prisma.post.count({ where: { categoryId: id } });
    if (postCount > 0) {
      return fail(
        'این دسته‌بندی به مقالاتی متصل است. ابتدا مقالات را به دسته دیگری منتقل کنید یا دسته را خالی کنید.',
      );
    }
    await prisma.postCategory.delete({ where: { id } });
    updateTag(tags.postCategories);
    updateTag(tags.posts);
    return ok(undefined);
  });
}
