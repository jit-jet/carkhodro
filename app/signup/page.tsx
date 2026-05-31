/**
 * Signup Page — Server Component
 * ────────────────────────────────
 * Extracts the `?phone=` query param (set by the login flow after OTP
 * verification) and passes it down to the SignupForm client component.
 *
 * Keeping this a server component avoids the need for a Suspense boundary
 * around useSearchParams, and lets Next.js stream the initial HTML faster.
 *
 * In Next.js 16 (App Router) `searchParams` is a Promise — must be awaited.
 */

import AuthCard from '@/src/components/auth/AuthCard';
import SignupForm from '@/src/components/auth/SignupForm';

interface Props {
  searchParams: Promise<{ phone?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const { phone = '' } = await searchParams;

  return (
    <AuthCard
      title="تکمیل اطلاعات"
      subtitle="برای تکمیل ثبت‌نام، لطفاً اطلاعات زیر را وارد کنید."
    >
      <SignupForm phoneNumber={phone} />
    </AuthCard>
  );
}
