import type { UserRole } from '@/generated/prisma_client';

const ANDROID_APP_MARKER = 'CarkhodroCapacitor/1';

/** The Android WebView appends this marker to its normal Android user agent. */
export function isAndroidAppUserAgent(userAgent: string | null): boolean {
  return Boolean(userAgent?.includes('Android') && userAgent.includes(ANDROID_APP_MARKER));
}

/** Return a route only when the Android app must leave the requested page. */
export function androidAppRedirect(pathname: string, role: UserRole | null): string | null {
  if (role === 'WHOLESALE') {
    return ['/', '/login', '/signup'].includes(pathname)
      ? '/dashboard'
      : null;
  }

  if (pathname === '/login') return null;
  if (!role && pathname === '/api/auth/clear-session') return null;
  return '/login';
}
