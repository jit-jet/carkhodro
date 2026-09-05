import 'dotenv/config';

const rawUrl = process.env.CAPACITOR_SERVER_URL?.trim();
if (!rawUrl) {
  console.error(
    'CAPACITOR_SERVER_URL is required. Set it to the deployed Next.js HTTPS origin before syncing native projects.',
  );
  process.exit(1);
}

let url;
try {
  url = new URL(rawUrl);
} catch {
  console.error('CAPACITOR_SERVER_URL must be an absolute http(s) URL.');
  process.exit(1);
}

if (!['http:', 'https:'].includes(url.protocol)) {
  console.error('CAPACITOR_SERVER_URL must use http or https.');
  process.exit(1);
}

const allowCleartext = process.env.CAPACITOR_ALLOW_CLEARTEXT === '1';
if (url.protocol !== 'https:' && !allowCleartext) {
  console.error(
    'Native release builds require HTTPS. For a local emulator only, set CAPACITOR_ALLOW_CLEARTEXT=1 explicitly.',
  );
  process.exit(1);
}

const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
if (publicUrl) {
  try {
    const publicOrigin = new URL(publicUrl).origin;
    if (publicOrigin !== url.origin) {
      console.warn(
        `Warning: NEXT_PUBLIC_APP_URL (${publicOrigin}) and CAPACITOR_SERVER_URL (${url.origin}) differ. Payment callbacks must return to the app origin in production.`,
      );
    }
  } catch {
    console.warn('Warning: NEXT_PUBLIC_APP_URL is not an absolute URL.');
  }
}

console.log(`Native server origin: ${url.origin}`);
