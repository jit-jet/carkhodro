import { readFile } from 'node:fs/promises';
import path from 'node:path';

const APK_DIRECTORY = path.join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk');
const RELEASE_APK_PATH = path.join(APK_DIRECTORY, 'release', 'app-release.apk');
const DEBUG_APK_PATH = path.join(APK_DIRECTORY, 'debug', 'app-debug.apk');

export async function GET() {
  try {
    let apk;
    try {
      apk = await readFile(RELEASE_APK_PATH);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      apk = await readFile(DEBUG_APK_PATH);
    }

    return new Response(apk, {
      headers: {
        'Cache-Control': 'no-store',
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
