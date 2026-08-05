/**
 * Login Page — Phone → OTP flow
 * ────────────────────────────
 * Static shell + Suspense: session/`searchParams`/`cookies` are request-time
 * (Cache Components), so they live in a child boundary. Valid session →
 * redirect; stale cookie after revoke → `/api/auth/clear-session`; else OTP UI.
 */

import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthCard from '@/src/components/auth/AuthCard';
import LoginFlow from '@/src/components/auth/LoginFlow';
import { getCurrentUser, SESSION_COOKIE } from '@/src/lib/session';
import { safeInternalPath } from '@/src/lib/safe-internal-path';

interface Props {
  searchParams: Promise<{ redirect?: string }>;
}

function LoginFallback() {
  return (
    <AuthCard title="ورود به حساب کاربری" subtitle="شماره موبایل خود را وارد کنید.">
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

  const user = await getCurrentUser();
  if (user) redirect(redirectTo);

  // Session row gone / user inactive, but httpOnly cookie still present.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    const next = `/login?redirect=${encodeURIComponent(redirectTo)}`;
    redirect(`/api/auth/clear-session?next=${encodeURIComponent(next)}`);
  }

  return <LoginFlow />;
}
