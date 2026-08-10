'use server';

/**
 * Category mutation Server Actions — admin panel. Split out of
 * `actions/categories.ts` so `CategoriesManager` (a Client Component) can
 * import writes without pulling that file's `use cache` reads into the
 * browser bundle.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';
import { deleteRemovedFiles } from '@/src/lib/storage';

export interface CategoryInput {
  key: string;
  name: string;
  image?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export async function createCategory(
  input: CategoryInput,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('createCategory', async () => {
    if (!input.key?.trim() || !input.name?.trim()) {
      return fail('کلید و نام دسته‌بندی الزامی است.');
    }
    const created = await prisma.category.create({
      data: {
        key: input.key.trim(),
        name: input.name.trim(),
        image: input.image ?? '/logo.png',
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
        metaTitle: input.metaTitle?.trim() || null,
        metaDescription: input.metaDescription?.trim() || null,
      },
      select: { id: true },
    });
    updateTag(tags.categories);
    return ok(created);
  });
}

export async function updateCategory(
  id: number,
  input: Partial<CategoryInput>,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('updateCategory', async () => {
    const existing = await prisma.category.findUnique({ where: { id }, select: { image: true } });
    if (!existing) return fail('دسته‌بندی یافت نشد.');
    if (input.isActive === false) {
      const activeProductCount = await prisma.product.count({
        where: { categoryId: id, isActive: true },
      });
      if (activeProductCount > 0) {
        return fail(
          'این دسته‌بندی دارای محصول فعال است و نمی‌توان آن را غیرفعال کرد.',
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(input.key !== undefined ? { key: input.key.trim() } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.image !== undefined ? { image: input.image ?? '/logo.png' } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle?.trim() || null } : {}),
        ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription?.trim() || null } : {}),
      },
      select: { id: true },
    });
    if (input.image !== undefined) {
      await deleteRemovedFiles([existing.image], [input.image ?? '/logo.png']);
    }
    updateTag(tags.categories);
    return ok(updated);
  });
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  return runMutation('deleteCategory', async () => {
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return fail('این دسته‌بندی به محصولاتی متصل است. ابتدا آن‌ها را به دسته دیگری منتقل کنید.');
    }
    const existing = await prisma.category.findUnique({ where: { id }, select: { image: true } });
    if (!existing) return fail('دسته‌بندی یافت نشد.');
    await prisma.category.delete({ where: { id } });
    await deleteRemovedFiles([existing.image], []);
    updateTag(tags.categories);
    return ok(undefined);
  });
}
