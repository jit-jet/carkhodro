/**
 * Category Server Actions — reads only. Categories change rarely → `days`
 * cache profile.
 *
 * Mutations live in `actions/admin-categories.ts` (pure `use server`, no
 * `use cache` reads) so they can be imported directly by admin Client
 * Components — see the comment at the top of `actions/products.ts` for why
 * the split is necessary.
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { toCategoryVM, type CategoryVM } from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export async function getCategories(): Promise<CategoryVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.categories, tags.products);

  return safeQuery('getCategories', async () => {
    const rows = await prisma.category.findMany({
      where: { isActive: true, products: { some: { isActive: true } } },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    return rows.map((c) =>
      toCategoryVM({
        id: c.id,
        key: c.key,
        name: c.name,
        image: c.image,
        productCount: c._count.products,
      }),
    );
  }, []);
}

export async function getCategoryByKey(key: string): Promise<CategoryVM | null> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.categories);

  return safeQuery(`getCategoryByKey:${key}`, async () => {
    const row = await prisma.category.findFirst({
      where: { key, isActive: true },
    });
    return row ? toCategoryVM(row) : null;
  }, null);
}

/** Admin CRUD — includes inactive categories. */
export interface AdminCategoryVM extends CategoryVM {
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
}

export async function getCategoriesAdmin(): Promise<AdminCategoryVM[]> {
  return safeQuery('getCategoriesAdmin', async () => {
    const rows = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return rows.map((c) => ({
      ...toCategoryVM({
        id: c.id,
        key: c.key,
        name: c.name,
        image: c.image,
        productCount: c._count.products,
      }),
      isActive: c.isActive,
      metaTitle: c.metaTitle,
      metaDescription: c.metaDescription,
    }));
  }, []);
}
