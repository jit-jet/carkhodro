import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { toPostVM, toPostDetailVM, type PostVM, type PostDetailVM } from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

const PAGE_SIZE = 12;

/**
 * Paginated published posts with optional full-text search (title + excerpt)
 * and optional tag filter. Each unique (page, search, tag) triple is a
 * separate cache entry, all tagged `posts` for bulk invalidation.
 */
export async function getPosts(
  page: number = 1,
  search: string = '',
  tag: string = '',
): Promise<{ posts: PostVM[]; total: number; pages: number }> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.posts);

  return safeQuery('getPosts', async () => {
    const where = {
      isPublished: true,
      ...(search.trim()
        ? {
            OR: [
              { title:   { contains: search.trim(), mode: 'insensitive' as const } },
              { excerpt: { contains: search.trim(), mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          author: true,
          tags: true,
          readTime: true,
          publishedAt: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      posts: rows.map(toPostVM),
      total,
      pages: Math.ceil(total / PAGE_SIZE),
    };
  }, { posts: [], total: 0, pages: 0 });
}

/** Full post detail for /blog/[slug]. Returns null if not found / unpublished. */
export async function getPostBySlug(slug: string): Promise<PostDetailVM | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.post(slug));

  return safeQuery(`getPostBySlug:${slug}`, async () => {
    const row = await prisma.post.findFirst({
      where: { slug, isPublished: true },
    });
    return row ? toPostDetailVM(row) : null;
  }, null);
}
