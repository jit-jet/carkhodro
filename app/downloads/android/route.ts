import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getCurrentUser } from '@/src/lib/session';
import { isWholesaleUser } from '@/src/lib/user-role';

const APK_PATH = path.join(
  process.cwd(),
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'debug',
  'app-debug.apk',
);

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new Response('Authentication required', { status: 401 });
  }

  if (!isWholesaleUser(user.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const apk = await readFile(APK_PATH);

    return new Response(apk, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'attachment; filename="carkhodro-android.apk"',
        'Content-Length': apk.byteLength.toString(),
        'Content-Type': 'application/vnd.android.package-archive',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new Response('Android application is not built', { status: 404 });
    }
    throw error;
  }
}
