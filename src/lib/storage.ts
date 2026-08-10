/**
 * Local file storage under `public/storage/{subfolder}/`.
 * DB columns store only the public URL path (e.g. `/storage/avatars/userId.jpg`).
 */

import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type StorageFolder =
  | 'avatars'
  | 'products'
  | 'categories'
  | 'brands'
  | 'cars'
  | 'posts'
  | 'settings'
  | 'banners';

const STORAGE_ROOT = path.resolve(
  /* turbopackIgnore: true */
  process.env.STORAGE_ROOT ?? path.join(process.cwd(), 'public', 'storage'),
);

const STORAGE_FOLDERS: readonly StorageFolder[] = [
  'avatars',
  'products',
  'categories',
  'brands',
  'cars',
  'posts',
  'settings',
  'banners',
];

function isSafeFilename(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name) && !name.includes('..');
}

/** Absolute disk path for a storage subfolder. */
function folderPath(folder: StorageFolder): string {
  return path.join(STORAGE_ROOT, folder);
}

/** Resolves a managed public URL to its absolute file path. */
export function storedFilePath(
  folder: string,
  filename: string,
): string | null {
  if (!STORAGE_FOLDERS.includes(folder as StorageFolder)) return null;
  if (!isSafeFilename(filename)) return null;
  return path.join(folderPath(folder as StorageFolder), filename);
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

  if (!STORAGE_FOLDERS.includes(folder as StorageFolder)) return;

  try {
    await unlink(path.join(folderPath(folder as StorageFolder), filename));
  } catch (err) {
    // Already gone — fine.
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

/** Returns every managed storage URL referenced by strings such as HTML bodies. */
export function storageUrlsIn(...values: Array<string | null | undefined>): Set<string> {
  const urls = new Set<string>();
  const pattern = /\/storage\/(avatars|products|categories|brands|cars|posts|settings|banners)\/[a-zA-Z0-9._-]+/g;
  for (const value of values) {
    if (!value) continue;
    for (const match of value.matchAll(pattern)) urls.add(match[0]);
  }
  return urls;
}

/** Deletes managed URLs present in `previous` but no longer present in `next`. */
export async function deleteRemovedFiles(
  previous: Iterable<string | null | undefined>,
  next: Iterable<string | null | undefined>,
): Promise<void> {
  const retained = new Set([...next].filter((url): url is string => Boolean(url)));
  const removed = [...new Set(previous)].filter(
    (url): url is string => Boolean(url) && !retained.has(url as string),
  );
  await Promise.all(removed.map((url) => deleteFile(url)));
}
