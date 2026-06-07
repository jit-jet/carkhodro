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

interface Props {
  searchParams: Promise<{ phone?: string }>;
}

export default function SignupPage({ searchParams }: Props) {
  return (
    <AuthCard
      title="تکمیل اطلاعات"
      subtitle="برای تکمیل ثبت‌نام، لطفاً اطلاعات زیر را وارد کنید."
    >
      <Suspense fallback={<SignupForm phoneNumber="" />}>
        <SignupFormWithPhone searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function SignupFormWithPhone({ searchParams }: Props) {
  const { phone = '' } = await searchParams;
  return <SignupForm phoneNumber={phone} />;
}
