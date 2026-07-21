import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import {
  toPostVM,
  toPostDetailVM,
  type PostVM,
  type PostDetailVM,
} from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

const PAGE_SIZE = 12;

const postListSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  author: true,
  tags: true,
  readTime: true,
  publishedAt: true,
  categoryId: true,
  category: { select: { id: true, slug: true, name: true } },
} as const;

/**
 * Paginated published posts with optional full-text search (title + excerpt),
 * tag filter, and category slug filter. Each unique filter combo is a
 * separate cache entry, all tagged `posts` for bulk invalidation.
 */
export async function getPosts(
  page: number = 1,
  search: string = '',
  tag: string = '',
  categorySlug: string = '',
): Promise<{ posts: PostVM[]; total: number; pages: number }> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.posts);
  if (categorySlug) cacheTag(tags.postCategories);

  return safeQuery(
    'getPosts',
    async () => {
      const where = {
        isPublished: true,
        ...(search.trim()
          ? {
              OR: [
                { title: { contains: search.trim(), mode: 'insensitive' as const } },
                { excerpt: { contains: search.trim(), mode: 'insensitive' as const } },
              ],
            }
          : {}),
        ...(tag ? { tags: { has: tag } } : {}),
        ...(categorySlug
          ? { category: { slug: categorySlug, isActive: true } }
          : {}),
      };

      const [rows, total] = await Promise.all([
        prisma.post.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: postListSelect,
        }),
        prisma.post.count({ where }),
      ]);

      return {
        posts: rows.map(toPostVM),
        total,
        pages: Math.ceil(total / PAGE_SIZE),
      };
    },
    { posts: [], total: 0, pages: 0 },
  );
}

/** Full post detail for /blog/[slug]. Returns null if not found / unpublished. */
export async function getPostBySlug(slug: string): Promise<PostDetailVM | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.post(slug));

  return safeQuery(
    `getPostBySlug:${slug}`,
    async () => {
      const row = await prisma.post.findFirst({
        where: { slug, isPublished: true },
        include: {
          category: { select: { id: true, slug: true, name: true } },
        },
      });
      return row ? toPostDetailVM(row) : null;
    },
    null,
  );
}

// ── Admin reads (no cache — always fresh for the panel) ─────────────────────

export interface AdminPostListItemVM {
  id: number;
  slug: string;
  title: string;
  author: string;
  coverImage: string;
  categoryName: string | null;
  tags: string[];
  readTime: number;
  publishedAt: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface AdminPostDetailVM {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  author: string;
  tags: string[];
  readTime: number;
  /** ISO date string suitable for `<input type="date">` */
  publishedAt: string;
  isPublished: boolean;
  categoryId: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

export async function getPostsAdmin(options?: {
  search?: string;
  status?: 'published' | 'draft' | 'all';
  categoryId?: number;
  page?: number;
  perPage?: number;
}): Promise<{
  items: AdminPostListItemVM[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const page = Math.max(1, options?.page ?? 1);
  const perPage = options?.perPage ?? 20;
  const search = options?.search?.trim() ?? '';
  const status = options?.status ?? 'all';

  const where = {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
            { author: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(status === 'published'
      ? { isPublished: true }
      : status === 'draft'
        ? { isPublished: false }
        : {}),
    ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        slug: true,
        title: true,
        author: true,
        coverImage: true,
        tags: true,
        readTime: true,
        publishedAt: true,
        isPublished: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      author: r.author,
      coverImage: r.coverImage,
      categoryName: r.category?.name ?? null,
      tags: r.tags,
      readTime: r.readTime,
      publishedAt: r.publishedAt.toISOString(),
      isPublished: r.isPublished,
      updatedAt: r.updatedAt.toISOString(),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getPostAdminById(id: number): Promise<AdminPostDetailVM | null> {
  const row = await prisma.post.findUnique({ where: { id } });
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverImage: row.coverImage,
    author: row.author,
    tags: row.tags,
    readTime: row.readTime,
    publishedAt: row.publishedAt.toISOString().slice(0, 10),
    isPublished: row.isPublished,
    categoryId: row.categoryId,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    metaKeywords: row.metaKeywords,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImage: row.ogImage,
  };
}
