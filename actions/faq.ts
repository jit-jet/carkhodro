import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { toFaqVM, type FaqVM } from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export async function getFaqs(): Promise<FaqVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.faqs);

  return safeQuery('getFaqs', async () => {
    const rows = await prisma.faq.findMany({ orderBy: { sortOrder: 'asc' } });
    return rows.map(toFaqVM);
  }, []);
}
