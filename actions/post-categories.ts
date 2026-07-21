/**
 * Post category reads — public + admin.
 * Mutations live in `actions/admin-post-categories.ts`.
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export interface PostCategoryVM {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sortOrder: number;
  isActive: boolean;
  postCount: number;
}

function mapCategory(
  row: {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    sortOrder: number;
    isActive: boolean;
    _count: { posts: number };
  },
): PostCategoryVM {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    postCount: row._count.posts,
  };
}

/** Active categories for storefront filters. */
export async function getPostCategories(): Promise<PostCategoryVM[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.postCategories);

  return safeQuery(
    'getPostCategories',
    async () => {
      const rows = await prisma.postCategory.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          _count: { select: { posts: { where: { isPublished: true } } } },
        },
      });
      return rows.map(mapCategory);
    },
    [],
  );
}

/** All categories for admin management (includes inactive). */
export async function getPostCategoriesAdmin(): Promise<PostCategoryVM[]> {
  const rows = await prisma.postCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { posts: true } } },
  });
  return rows.map(mapCategory);
}
