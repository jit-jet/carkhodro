import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { safeQuery } from '@/src/lib/result';
import { DEFAULT_RETURN_CONTENT, toReturnContentVM, type ReturnContentVM } from '@/src/lib/return-defaults';
import { tags } from '@/actions/cache-tags';

export async function getPublicReturnContent(): Promise<ReturnContentVM> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.returnContent);

  return safeQuery(
    'getPublicReturnContent',
    async () => toReturnContentVM(await prisma.returnContent.findUnique({ where: { id: 1 } })),
    { ...DEFAULT_RETURN_CONTENT },
  );
}
