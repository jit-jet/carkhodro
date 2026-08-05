'use client';

/**
 * Login flow — Phone → OTP (client).
 * Server page (`app/(site)/login/page.tsx`) validates the session first so a
 * stale cookie after account deactivation cannot bounce with the proxy.
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthCard from '@/src/components/auth/AuthCard';
import PhoneStep from '@/src/components/auth/PhoneStep';
import OtpStep from '@/src/components/auth/OtpStep';
import { requestOtp, verifyOtp } from '@/actions/auth';
import { refreshClientUI } from '@/src/store/refresh-client-ui';
import { safeInternalPath } from '@/src/lib/safe-internal-path';

type Step = 'phone' | 'otp';

export default function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeInternalPath(searchParams.get('redirect'), '/dashboard');

  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  function showDevCode(devCode?: string) {
    if (devCode) {
      alert(
        `پیامک ارسال شد (حالت توسعه)\n\nکد تأیید: ${devCode}\n\n` +
          `در محیط واقعی این کد از طریق پیامک ارسال می‌شود.`,
      );
    }
  }

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
        router.refresh();
      } else {
        const params = new URLSearchParams({ phone: phoneNumber });
        if (redirectTo !== '/dashboard') params.set('redirect', redirectTo);
        router.push(`/signup?${params.toString()}`);
      }
    })();
  }

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
