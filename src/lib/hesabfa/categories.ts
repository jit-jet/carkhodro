/**
 * Pull Hesabfa product categories into the local Category table.
 * Only top-level categories under «کالا» / «کالاها» are imported
 * (e.g. «موتوری», not child «یاتاقان»).
 * Docs: setting/getProductCategories returns a tree under Result.Root.
 */

import { revalidateTag } from 'next/cache';
import { tags } from '@/actions/cache-tags';
import { prisma } from '@/src/lib/prisma';
import { getProductCategories, isHesabfaConfigured } from './client';
import {
  isHesabfaRootCategoryName,
} from './category-path';
import type { HesabfaProductCategoryNode } from './types';

export {
  extractTopLevelCategories,
  isHesabfaRootCategoryName,
  topCategoryNameFromNodeFamily,
} from './category-path';

export interface CategorySyncStats {
  created: number;
  updated: number;
  skipped: number;
}

export const FALLBACK_CATEGORY_KEY = 'uncategorized';
export const FALLBACK_CATEGORY_NAME = 'دسته‌بندی نشده';

/** Build a stable URL-safe key from a Persian/Latin category name. */
export function categoryKeyFromName(name: string): string {
  const trimmed = name.trim();
  const slug = trimmed
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (slug.length > 0) return slug.slice(0, 80);
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
  }
  return `cat-${Math.abs(hash)}`;
}

/**
 * Upsert top-level Hesabfa categories into local categories (match by name, then key).
 * Does not delete local-only categories.
 */
export async function syncCategoriesFromHesabfa(
  nodes?: HesabfaProductCategoryNode[],
): Promise<CategorySyncStats> {
  const stats: CategorySyncStats = { created: 0, updated: 0, skipped: 0 };
  if (!(await isHesabfaConfigured()) && nodes == null) return stats;

  const list = nodes ?? (await getProductCategories());
  if (list.length === 0) return stats;

  const existing = await prisma.category.findMany({
    select: { id: true, name: true, key: true },
  });
  const byName = new Map(existing.map((c) => [c.name.trim(), c]));
  const byKey = new Map(existing.map((c) => [c.key.trim(), c]));
  const usedKeys = new Set(existing.map((c) => c.key.trim()));

  let nextSort = 0;
  const baseSort = Math.max(100, existing.length);

  for (const node of list) {
    const name = node.Name?.trim();
    if (!name || isHesabfaRootCategoryName(name)) {
      stats.skipped++;
      continue;
    }

    const hit = byName.get(name);
    if (hit) {
      await prisma.category.update({
        where: { id: hit.id },
        data: { isActive: true, name },
      });
      stats.updated++;
      continue;
    }

    let key = categoryKeyFromName(name);
    if (byKey.has(key) || usedKeys.has(key)) {
      let n = 2;
      while (byKey.has(`${key}-${n}`) || usedKeys.has(`${key}-${n}`)) n++;
      key = `${key}-${n}`;
    }

    const created = await prisma.category.create({
      data: {
        key,
        name,
        image: '/logo.png',
        sortOrder: baseSort + nextSort++,
        isActive: true,
      },
      select: { id: true, name: true, key: true },
    });
    byName.set(created.name.trim(), created);
    byKey.set(created.key.trim(), created);
    usedKeys.add(created.key.trim());
    stats.created++;
  }

  // Ensure the uncategorized fallback always exists.
  if (!byKey.has(FALLBACK_CATEGORY_KEY) && !byName.has(FALLBACK_CATEGORY_NAME)) {
    await prisma.category.upsert({
      where: { key: FALLBACK_CATEGORY_KEY },
      update: { name: FALLBACK_CATEGORY_NAME, isActive: true },
      create: {
        key: FALLBACK_CATEGORY_KEY,
        name: FALLBACK_CATEGORY_NAME,
        sortOrder: 999,
        isActive: true,
      },
    });
  }

  if (stats.created > 0 || stats.updated > 0) {
    revalidateTag(tags.categories, 'max');
  }

  return stats;
}

export async function fullSyncCategories(): Promise<CategorySyncStats> {
  return syncCategoriesFromHesabfa();
}
