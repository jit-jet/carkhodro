/**
 * Signup Page — Server Component
 * ────────────────────────────────
 * Extracts the `?phone=` query param (set by the login flow after OTP
 * verification) and passes it down to the SignupForm client component.
 *
 * Under Cache Components, `searchParams` / session cookies are request-time,
 * so they stream inside <Suspense> while the card shell ships in the static
 * prerender. In Next.js 16 `searchParams` is a Promise.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AuthCard from '@/src/components/auth/AuthCard';
import SignupForm from '@/src/components/auth/SignupForm';
import { getProvinces } from '@/actions/locations';
import { getCurrentUser } from '@/src/lib/session';
import { safeInternalPath } from '@/src/lib/safe-internal-path';

interface Props {
  searchParams: Promise<{ phone?: string; redirect?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const provinces = await getProvinces();
  return (
    <AuthCard
      title="تکمیل اطلاعات"
      subtitle="برای تکمیل ثبت‌نام، لطفاً اطلاعات زیر را وارد کنید."
    >
      <Suspense fallback={<SignupForm phoneNumber="" redirectTo="/dashboard" provinces={provinces} />}>
        <SignupGate searchParams={searchParams} provinces={provinces} />
      </Suspense>
    </AuthCard>
  );
}

async function SignupGate({
  searchParams,
  provinces,
}: Props & { provinces: Awaited<ReturnType<typeof getProvinces>> }) {
  const { phone = '', redirect: redirectParam = '/dashboard' } = await searchParams;
  const redirectTo = safeInternalPath(redirectParam, '/dashboard');

  const user = await getCurrentUser();
  if (user) redirect(redirectTo);

  return <SignupForm phoneNumber={phone} redirectTo={redirectTo} provinces={provinces} />;
}
