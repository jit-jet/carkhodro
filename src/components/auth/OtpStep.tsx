'use client';

import { useEffect, useRef, useState } from 'react';
import { normalizeOtpCode, OTP_INPUT_LENGTH } from '@/src/lib/otp-autofill';

const RESEND_SECONDS = 60;

interface Props {
  phoneNumber: string;
  code: string;
  onCodeChange: (code: string) => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  loading: boolean;
  error: string;
}

export default function OtpStep({
  phoneNumber,
  code,
  onCodeChange,
  onVerify,
  onResend,
  onBack,
  loading,
  error,
}: Props) {
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (code.length !== OTP_INPUT_LENGTH || loading) return;
    await onVerify(code);
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    onCodeChange('');
    inputRef.current?.focus();
    try {
      await onResend();
      setCountdown(RESEND_SECONDS);
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <p className="text-sm text-gray-500 text-center leading-6">
        کد ۴ رقمی ارسال‌شده به{' '}
        <span dir="ltr" className="font-mono font-bold text-charcoal tracking-widest">{phoneNumber}</span>{' '}
        را وارد کنید.
      </p>

      <div className="mx-auto w-full max-w-64" dir="ltr">
        <input
          ref={inputRef}
          type="text"
          name="one-time-code"
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]*"
          value={code}
          onChange={(event) => onCodeChange(normalizeOtpCode(event.target.value))}
          autoFocus
          aria-label="کد تأیید چهار رقمی"
          aria-invalid={Boolean(error)}
          className={`h-14 w-full rounded-2xl border-2 bg-white text-center font-mono text-2xl font-bold tracking-[0.8em] pl-[0.8em] text-charcoal outline-none transition-colors ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-accent'
          }`}
        />
      </div>

      {error && <p role="alert" className="text-red-500 text-xs text-center -mt-2">{error}</p>}

      <button
        type="submit"
        disabled={code.length !== OTP_INPUT_LENGTH || loading}
        className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-charcoal font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Spinner />}
        {loading ? 'در حال بررسی...' : 'تأیید کد'}
      </button>

      <div className="flex items-center justify-between text-sm pt-1">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-charcoal transition-colors">
          <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          تغییر شماره
        </button>

        {countdown > 0 ? (
          <span className="text-gray-400 tabular-nums" dir="ltr">ارسال مجدد ({countdown}s)</span>
        ) : (
          <button type="button" onClick={handleResend} disabled={resending} className="text-accent-dark font-semibold hover:underline disabled:opacity-50 transition-colors">
            {resending ? 'در حال ارسال...' : 'ارسال مجدد کد'}
          </button>
        )}
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
