'use server';

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { fail, ok, runMutation, safeQuery, type ActionResult } from '@/src/lib/result';

export type SeoRedirectVM = { id: number; source: string; destination: string; statusCode: number };
const tag = 'seo-redirects';

function normalizePath(value: string): string | null {
  const path = value.trim();
  if (!path.startsWith('/') || path.startsWith('//') || /[?#]/.test(path)) return null;
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

export async function getSeoRedirects(): Promise<SeoRedirectVM[]> {
  return safeQuery('getSeoRedirects', () => prisma.seoRedirect.findMany({ orderBy: { source: 'asc' } }), []);
}

export async function saveSeoRedirect(input: { id?: number; source: string; destination: string; statusCode: number }): Promise<ActionResult<SeoRedirectVM>> {
  return runMutation('saveSeoRedirect', async () => {
    const source = normalizePath(input.source); const destination = normalizePath(input.destination);
    if (!source || !destination) return fail('مبدأ و مقصد باید مسیر داخلی معتبر و بدون query/hash باشند.');
    if (source === destination) return fail('مبدأ و مقصد نمی‌توانند یکسان باشند.');
    if (input.statusCode !== 301 && input.statusCode !== 302) return fail('نوع ریدایرکت باید ۳۰۱ یا ۳۰۲ باشد.');
    const row = input.id
      ? await prisma.seoRedirect.update({ where: { id: input.id }, data: { source, destination, statusCode: input.statusCode } })
      : await prisma.seoRedirect.create({ data: { source, destination, statusCode: input.statusCode } });
    updateTag(tag); return ok(row);
  });
}

export async function deleteSeoRedirect(id: number): Promise<ActionResult> {
  return runMutation('deleteSeoRedirect', async () => { await prisma.seoRedirect.delete({ where: { id } }); updateTag(tag); return ok(undefined); });
}

export async function findSeoRedirect(source: string): Promise<{ destination: string; statusCode: number } | null> {
  const normalized = normalizePath(source); if (!normalized) return null;
  return prisma.seoRedirect.findUnique({ where: { source: normalized }, select: { destination: true, statusCode: true } });
}
