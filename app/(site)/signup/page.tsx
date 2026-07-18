/**
 * Signup Page — Server Component
 * ────────────────────────────────
 * Extracts the `?phone=` query param (set by the login flow after OTP
 * verification) and passes it down to the SignupForm client component.
 *
 * Under Cache Components, `searchParams` is request-time data, so the part that
 * reads it streams inside a <Suspense> boundary while the card shell ships in
 * the static prerender. In Next.js 16 `searchParams` is a Promise.
 */

import { Suspense } from 'react';
import AuthCard from '@/src/components/auth/AuthCard';
import SignupForm from '@/src/components/auth/SignupForm';
import { getProvinces } from '@/actions/locations';

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
        <SignupFormWithPhone searchParams={searchParams} provinces={provinces} />
      </Suspense>
    </AuthCard>
  );
}

async function SignupFormWithPhone({
  searchParams,
  provinces,
}: Props & { provinces: Awaited<ReturnType<typeof getProvinces>> }) {
  const { phone = '', redirect = '/dashboard' } = await searchParams;
  return <SignupForm phoneNumber={phone} redirectTo={redirect} provinces={provinces} />;
}
