import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { storedFilePath } from '@/src/lib/storage';

const CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export async function GET(
  _request: Request,
  context: RouteContext<'/storage/[folder]/[filename]'>,
) {
  const { folder, filename } = await context.params;
  const filePath = storedFilePath(folder, filename);
  if (!filePath) return new Response('Not found', { status: 404 });

  const contentType = CONTENT_TYPES[path.extname(filename).toLowerCase()];
  if (!contentType) return new Response('Not found', { status: 404 });

  try {
    const file = await readFile(filePath);
    return new Response(file, {
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new Response('Not found', { status: 404 });
    }
    throw error;
  }
}
