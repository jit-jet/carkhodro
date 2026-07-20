'use client';

/**
 * Login Page — Phone → OTP flow
 * ────────────────────────────
 * Orchestrates two sequential steps:
 *   1. PhoneStep  — user enters their mobile number
 *   2. OtpStep    — user enters the 4-digit code
 *
 * After OTP verification:
 *   • Existing user  →  session is created server-side  →  `?redirect=` or /dashboard
 *   • New user       →  /signup?phone=…  (carries `?redirect=` through)
 *
 * Backend calls go through the real Server Actions in `actions/auth.ts`
 * (`requestOtp` / `verifyOtp`). When SMS_API_KEY is "console", the OTP isn't
 * texted — the action returns it as `devCode` and we `alert` it for testing.
 *
 * Wrapped in <Suspense> because it reads `useSearchParams()` (the `redirect`
 * destination set when a guest is bounced here from checkout).
 */

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthCard from '@/src/components/auth/AuthCard';
import PhoneStep from '@/src/components/auth/PhoneStep';
import OtpStep from '@/src/components/auth/OtpStep';
import { requestOtp, verifyOtp } from '@/actions/auth';
import { refreshClientUI } from '@/src/store/refresh-client-ui';

type Step = 'phone' | 'otp';

function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';

  // ── Flow state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function withLoading(fn: () => Promise<void>) {
    return async () => {
      setLoading(true);
      setError('');
      try {
        await fn();
      } catch {
        setError('خطا در اتصال. لطفاً دوباره تلاش کنید.');
      } finally {
        setLoading(false);
      }
    };
  }

  /** Console mode: show the OTP when SMS_API_KEY is "console" (no real SMS). */
  function showDevCode(devCode?: string) {
    if (devCode) {
      alert(
        `پیامک ارسال شد (حالت توسعه)\n\nکد تأیید: ${devCode}\n\n` +
          `در محیط واقعی این کد از طریق پیامک ارسال می‌شود.`,
      );
    }
  }

  // ── Step handlers ────────────────────────────────────────────────────────────

  /** STEP 1 — Send OTP, then advance to the code-entry step. */
  async function handleSendOtp(phone: string) {
    await withLoading(async () => {
      const res = await requestOtp(phone);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      showDevCode(res.data.devCode);
      setPhoneNumber(phone);
      setStep('otp');
    })();
  }

  /**
   * STEP 2a — Verify OTP.
   * Existing user (session now set) → `redirect` or /dashboard.
   * New user                       → /signup, carrying phone + redirect.
   */
  async function handleVerifyOtp(code: string) {
    await withLoading(async () => {
      const res = await verifyOtp(phoneNumber, code);
      if (!res.ok) {
        setError(res.error);
        return;
      }

      if (res.data.userExists) {
        await refreshClientUI();
        router.push(redirectTo);
        router.refresh(); // reflect the new session (header, cart merge)
      } else {
        const params = new URLSearchParams({ phone: phoneNumber });
        if (redirectTo !== '/dashboard') params.set('redirect', redirectTo);
        router.push(`/signup?${params.toString()}`);
      }
    })();
  }

  /** STEP 2b — Resend OTP (triggered from within OtpStep). */
  async function handleResend() {
    await withLoading(async () => {
      const res = await requestOtp(phoneNumber);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      showDevCode(res.data.devCode);
    })();
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const cardProps =
    step === 'phone'
      ? { title: 'ورود به حساب کاربری', subtitle: 'شماره موبایل خود را وارد کنید.' }
      : { title: 'تأیید شماره موبایل', subtitle: 'کد ارسال‌شده را وارد کنید.' };

  return (
    <AuthCard {...cardProps}>
      {step === 'phone' ? (
        <PhoneStep onSubmit={handleSendOtp} loading={loading} error={error} />
      ) : (
        <OtpStep
          phoneNumber={phoneNumber}
          onVerify={handleVerifyOtp}
          onResend={handleResend}
          onBack={() => {
            setStep('phone');
            setError('');
          }}
          loading={loading}
          error={error}
        />
      )}
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="ورود به حساب کاربری" subtitle="شماره موبایل خود را وارد کنید.">
          <div className="h-40" />
        </AuthCard>
      }
    >
      <LoginFlow />
    </Suspense>
  );
}
