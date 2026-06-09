/**
 * Category Server Actions. Categories change rarely → `days` cache profile.
 */

import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { toCategoryVM, type CategoryVM } from '@/src/lib/serializers';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export async function getCategories(): Promise<CategoryVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.categories);

  return safeQuery('getCategories', async () => {
    const rows = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    return rows.map(toCategoryVM);
  }, []);
}

export async function getCategoryByKey(key: string): Promise<CategoryVM | null> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.categories);

  return safeQuery(`getCategoryByKey:${key}`, async () => {
    const row = await prisma.category.findUnique({ where: { key } });
    return row ? toCategoryVM(row) : null;
  }, null);
}

// ── Mutations ────────────────────────────────────────────────────────────────

export interface CategoryInput {
  key: string;
  name: string;
  image?: string | null;
  sortOrder?: number;
}

export async function createCategory(
  input: CategoryInput,
): Promise<ActionResult<{ id: number }>> {
  'use server';
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
  'use server';
  return runMutation('updateCategory', async () => {
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(input.key !== undefined ? { key: input.key.trim() } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.image !== undefined ? { image: input.image ?? '/logo.png' } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
      select: { id: true },
    });
    updateTag(tags.categories);
    return ok(updated);
  });
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  'use server';
  return runMutation('deleteCategory', async () => {
    await prisma.category.delete({ where: { id } });
    updateTag(tags.categories);
    return ok(undefined);
  });
}
