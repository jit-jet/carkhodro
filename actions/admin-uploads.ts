'use server';

/**
 * Shared image upload for admin taxonomy (categories, brands, car models).
 * Mirrors `uploadProductImage` validation/storage conventions.
 */

import crypto from 'node:crypto';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { saveFile, type StorageFolder } from '@/src/lib/storage';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const TAXONOMY_FOLDERS = ['categories', 'brands', 'cars', 'posts'] as const;
export type TaxonomyImageFolder = (typeof TAXONOMY_FOLDERS)[number];

function isTaxonomyFolder(folder: string): folder is TaxonomyImageFolder {
  return (TAXONOMY_FOLDERS as readonly string[]).includes(folder);
}

export async function uploadAdminImage(
  folder: TaxonomyImageFolder,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  return runMutation('uploadAdminImage', async () => {
    if (!isTaxonomyFolder(folder)) return fail('پوشه آپلود نامعتبر است.');

    const file = formData.get('image');
    if (!(file instanceof File) || file.size === 0) return fail('فایلی انتخاب نشد.');

    const ext = ALLOWED_IMAGE_TYPES[file.type];
    if (!ext) return fail('فرمت تصویر باید jpg، png یا webp باشد.');
    if (file.size > MAX_IMAGE_BYTES) return fail('حجم تصویر باید کمتر از ۲ مگابایت باشد.');

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${crypto.randomUUID()}.${ext}`;
    const url = await saveFile(folder as StorageFolder, filename, buffer);
    return ok({ url });
  });
}
