import type { Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { siteUrl } from '@/src/lib/seo';

export async function buildStaticPageMetadata(
  path: string,
  fallback: { title: string; description: string },
): Promise<Metadata> {
  'use cache';
  cacheLife('days');
  cacheTag(`static-page-seo:${path}`);

  const row = await prisma.staticPageSeo.findUnique({ where: { path } });
  const title = row?.metaTitle?.trim() || fallback.title;
  const description = row?.metaDescription?.trim() || fallback.description;
  const canonical = siteUrl(path);
  const image = row?.ogImageUrl?.trim();

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}
