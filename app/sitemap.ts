import type { MetadataRoute } from 'next';
import { prisma } from '@/src/lib/prisma';
import { siteUrl } from '@/src/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, posts] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { key: true, updatedAt: true } }),
    prisma.post.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const staticPages = ['/', '/products', '/blog', '/about', '/contact', '/faq', '/rules'].map((path) => ({ url: siteUrl(path), lastModified: new Date(), changeFrequency: 'weekly' as const }));
  return [
    ...staticPages,
    ...products.map((p) => ({ url: siteUrl(`/products/${p.id}`), lastModified: p.updatedAt, changeFrequency: 'daily' as const })),
    ...categories.map((c) => ({ url: siteUrl(`/products?category=${encodeURIComponent(c.key)}`), lastModified: c.updatedAt, changeFrequency: 'weekly' as const })),
    ...posts.map((p) => ({ url: siteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: 'weekly' as const })),
  ];
}
