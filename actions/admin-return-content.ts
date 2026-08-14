'use server';

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { DEFAULT_RETURN_CONTENT, toReturnContentVM, type ReturnContentVM } from '@/src/lib/return-defaults';
import { tags } from '@/actions/cache-tags';
import { deleteRemovedFiles, storageUrlsIn } from '@/src/lib/storage';

export async function getReturnContent(): Promise<ReturnContentVM> {
  return safeQuery('getReturnContent', async () =>
    toReturnContentVM(await prisma.returnContent.findUnique({ where: { id: 1 } })), { ...DEFAULT_RETURN_CONTENT });
}

export async function updateReturnContent(input: Partial<ReturnContentVM>): Promise<ActionResult> {
  return runMutation('updateReturnContent', async () => {
    const body = input.body?.trim() ?? '';
    if (!body) return fail('متن شرایط مرجوعی نمی‌تواند خالی باشد.');
    const previous = await prisma.returnContent.findUnique({ where: { id: 1 }, select: { body: true } });
    await prisma.returnContent.upsert({ where: { id: 1 }, create: { id: 1, body }, update: { body } });
    await deleteRemovedFiles(storageUrlsIn(previous?.body), storageUrlsIn(body));
    updateTag(tags.returnContent);
    return ok(undefined);
  });
}
