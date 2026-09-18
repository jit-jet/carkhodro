/**
 * Login Page — Phone → OTP flow
 * ────────────────────────────
 * Static shell + Suspense: session/`searchParams`/`cookies` are request-time
 * (Cache Components), so they live in a child boundary. Valid session →
 * redirect; stale cookie after revoke → `/api/auth/clear-session`; else OTP UI.
 */

import { Suspense } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthCard from '@/src/components/auth/AuthCard';
import AppUnavailableLogout from '@/src/components/auth/AppUnavailableLogout';
import LoginFlow from '@/src/components/auth/LoginFlow';
import { getPublicSiteSettings } from '@/actions/site-settings';
import { getCurrentUser, SESSION_COOKIE } from '@/src/lib/session';
import { safeInternalPath } from '@/src/lib/safe-internal-path';
import { resolvedLogoUrl, resolvedSiteName } from '@/src/lib/site-branding';
import { isAndroidAppUserAgent } from '@/src/lib/native-app';

interface Props {
  searchParams: Promise<{ redirect?: string }>;
}

function LoginFallback() {
  return (
    <AuthCard
      title="ورود به حساب کاربری"
      subtitle="شماره موبایل خود را وارد کنید."
    >
      <div className="h-40" />
    </AuthCard>
  );
}

export default function LoginPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginGate searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginGate({ searchParams }: Props) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo = safeInternalPath(redirectParam, '/dashboard');

  const [user, settings, requestHeaders] = await Promise.all([
    getCurrentUser(),
    getPublicSiteSettings(),
    headers(),
  ]);
  const androidApp = isAndroidAppUserAgent(requestHeaders.get('user-agent'));
  if (user) {
    if (androidApp && user.role !== 'WHOLESALE') {
      return (
        <AuthCard title="دسترسی به اپلیکیشن فعال نیست">
          <p className="mb-6 text-center text-sm leading-7 text-gray-600">
            به اپلیکیشن کارخودرو خوش آمدید
            <br />
            این اپلیکیشن ویژه همکاران گرامی طراحی شده است.
            <br />
            برای فعال‌سازی دسترسی و مشاهده قیمت‌های همکاری، با شماره 09152051425 تماس بگیرید.
          </p>
          <AppUnavailableLogout />
        </AuthCard>
      );
    }
    redirect(androidApp ? '/dashboard' : redirectTo);
  }

  // Session row gone / user inactive, but httpOnly cookie still present.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    const next = `/login?redirect=${encodeURIComponent(redirectTo)}`;
    redirect(`/api/auth/clear-session?next=${encodeURIComponent(next)}`);
  }

  return (
    <LoginFlow
      logoUrl={resolvedLogoUrl(settings)}
      siteName={resolvedSiteName(settings)}
      androidApp={androidApp}
    />
  );
}
