'use client';

/**
 * Login Page — Phone → OTP flow
 * ────────────────────────────
 * Orchestrates two sequential steps:
 *   1. PhoneStep  — user enters their mobile number
 *   2. OtpStep    — user enters the 4-digit code
 *
 * After OTP verification:
 *   • Existing user  →  /dashboard
 *   • New user       →  /signup?phone=…  (pre-fills phone on the signup form)
 *
 * All API calls go through src/lib/authApi.ts.
 * This component only manages UI flow state.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard from '@/src/components/auth/AuthCard';
import PhoneStep from '@/src/components/auth/PhoneStep';
import OtpStep from '@/src/components/auth/OtpStep';
import { sendOtp, verifyOtp } from '@/src/lib/authApi';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();

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

  // ── Step handlers ────────────────────────────────────────────────────────────

  /**
   * STEP 1 — Send OTP
   * On success, advance to the OTP entry step.
   */
  async function handleSendOtp(phone: string) {
    await withLoading(async () => {
      const res = await sendOtp(phone);
      if (!res.ok) { setError(res.message); return; }
      setPhoneNumber(phone);
      setStep('otp');
    })();
  }

  /**
   * STEP 2a — Verify OTP
   * Existing user  → /dashboard
   * New user       → /signup?phone=…
   */
  async function handleVerifyOtp(code: string) {
    await withLoading(async () => {
      const res = await verifyOtp(phoneNumber, code);
      if (!res.ok) { setError(res.message); return; }

      if (res.userExists) {
        router.push('/dashboard');
      } else {
        router.push(`/signup?phone=${encodeURIComponent(phoneNumber)}`);
      }
    })();
  }

  /**
   * STEP 2b — Resend OTP (triggered from within OtpStep)
   * Resets the code by calling sendOtp again; OtpStep resets its own timer.
   */
  async function handleResend() {
    await withLoading(async () => {
      const res = await sendOtp(phoneNumber);
      if (!res.ok) setError(res.message);
    })();
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const cardProps =
    step === 'phone'
      ? { title: 'ورود به حساب کاربری', subtitle: 'شماره موبایل خود را وارد کنید.' }
      : { title: 'تأیید شماره موبایل',   subtitle: 'کد ارسال‌شده را وارد کنید.' };

  return (
    <AuthCard {...cardProps}>
      {step === 'phone' ? (
        <PhoneStep
          onSubmit={handleSendOtp}
          loading={loading}
          error={error}
        />
      ) : (
        <OtpStep
          phoneNumber={phoneNumber}
          onVerify={handleVerifyOtp}
          onResend={handleResend}
          onBack={() => { setStep('phone'); setError(''); }}
          loading={loading}
          error={error}
        />
      )}
    </AuthCard>
  );
}
