'use server';

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { fail, ok, runMutation, safeQuery, type ActionResult } from '@/src/lib/result';
import { isManagedStaticPage, MANAGED_STATIC_PAGES } from '@/src/lib/static-pages';

export type StaticPageSeoVM = {
  path: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
};

export async function getStaticPagesSeo(): Promise<StaticPageSeoVM[]> {
  return safeQuery('getStaticPagesSeo', async () => {
    const rows = await prisma.staticPageSeo.findMany();
    const byPath = new Map(rows.map((row) => [row.path, row]));
    return MANAGED_STATIC_PAGES.map((page) => {
      const row = byPath.get(page.path);
      return {
        path: page.path,
        label: page.label,
        metaTitle: row?.metaTitle ?? '',
        metaDescription: row?.metaDescription ?? '',
        ogImageUrl: row?.ogImageUrl ?? '',
      };
    });
  }, MANAGED_STATIC_PAGES.map((page) => ({ path: page.path, label: page.label, metaTitle: '', metaDescription: '', ogImageUrl: '' })));
}

export async function updateStaticPageSeo(input: {
  path: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
}): Promise<ActionResult> {
  return runMutation('updateStaticPageSeo', async () => {
    if (!isManagedStaticPage(input.path)) return fail('صفحه انتخاب‌شده معتبر نیست.');
    await prisma.staticPageSeo.upsert({
      where: { path: input.path },
      create: {
        path: input.path,
        metaTitle: input.metaTitle.trim() || null,
        metaDescription: input.metaDescription.trim() || null,
        ogImageUrl: input.ogImageUrl.trim() || null,
      },
      update: {
        metaTitle: input.metaTitle.trim() || null,
        metaDescription: input.metaDescription.trim() || null,
        ogImageUrl: input.ogImageUrl.trim() || null,
      },
    });
    updateTag(`static-page-seo:${input.path}`);
    return ok(undefined);
  });
}
