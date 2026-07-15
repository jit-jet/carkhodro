/**
 * Local file storage under `public/storage/{subfolder}/`.
 * DB columns store only the public URL path (e.g. `/storage/avatars/userId.jpg`).
 */

import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type StorageFolder = 'avatars' | 'products' | 'categories' | 'brands' | 'posts';

const STORAGE_ROOT = path.join(process.cwd(), 'public', 'storage');

function isSafeFilename(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name) && !name.includes('..');
}

/** Absolute disk path for a storage subfolder. */
function folderPath(folder: StorageFolder): string {
  return path.join(STORAGE_ROOT, folder);
}

/**
 * Writes `buffer` as `public/storage/{folder}/{filename}` and returns the
 * public URL path stored in the database.
 */
export async function saveFile(
  folder: StorageFolder,
  filename: string,
  buffer: Buffer,
): Promise<string> {
  if (!isSafeFilename(filename)) {
    throw new Error('Invalid storage filename.');
  }

  const dir = folderPath(folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/storage/${folder}/${filename}`;
}

/**
 * Deletes a previously saved storage file given its public URL path.
 * No-ops for non-storage paths (legacy data URLs, remote URLs, etc.).
 */
export async function deleteFile(urlPath: string | null | undefined): Promise<void> {
  if (!urlPath || !urlPath.startsWith('/storage/')) return;

  const relative = urlPath.slice('/storage/'.length);
  const segments = relative.split('/').filter(Boolean);
  if (segments.length !== 2) return;

  const [folder, filename] = segments;
  if (!isSafeFilename(filename)) return;

  const allowed: StorageFolder[] = ['avatars', 'products', 'categories', 'brands', 'posts'];
  if (!allowed.includes(folder as StorageFolder)) return;

  try {
    await unlink(path.join(folderPath(folder as StorageFolder), filename));
  } catch (err) {
    // Already gone — fine.
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}
