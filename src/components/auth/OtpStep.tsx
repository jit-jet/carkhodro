'use client';

import { useState, useRef, useEffect } from 'react';

const CODE_LENGTH = 4;
const RESEND_SECONDS = 60;

interface Props {
  phoneNumber: string;
  /** Called with the 4-digit code string when the user submits */
  onVerify: (code: string) => Promise<void>;
  /** Called when the user requests a new OTP */
  onResend: () => Promise<void>;
  /** Returns the user to the phone-number step */
  onBack: () => void;
  loading: boolean;
  error: string;
}

export default function OtpStep({
  phoneNumber,
  onVerify,
  onResend,
  onBack,
  loading,
  error,
}: Props) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join('');
  const isFilled = code.length === CODE_LENGTH && digits.every(Boolean);

  // ── Countdown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // ── OTP digit handlers ───────────────────────────────────────────────────────

  function handleChange(index: number, raw: string) {
    // Accept only a single digit
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    // Auto-advance focus
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Jump to previous box on backspace when current box is empty
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft'  && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (e.key === 'ArrowRight' && index > 0)               inputRefs.current[index - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    const next: string[] = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    // Focus the last filled box (or the first empty one)
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFilled || loading) return;
    await onVerify(code);
  }

  // ── Resend ───────────────────────────────────────────────────────────────────

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    setDigits(Array(CODE_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    await onResend();
    setCountdown(RESEND_SECONDS);
    setResending(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Description */}
      <p className="text-sm text-gray-500 text-center leading-6">
        کد ۴ رقمی ارسال‌شده به{' '}
        <span dir="ltr" className="font-mono font-bold text-charcoal tracking-widest">
          {phoneNumber}
        </span>{' '}
        را وارد کنید.
      </p>

      {/* 4-box digit input — always LTR so box order matches digit order */}
      <div
        dir="ltr"
        className="flex justify-center gap-3"
        onPaste={handlePaste}
        role="group"
        aria-label="کد تأیید"
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
            aria-label={`رقم ${i + 1}`}
            className={[
              'w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2',
              'transition-all focus:outline-none select-none',
              digit
                ? 'border-accent bg-amber-50 text-charcoal shadow-sm'
                : error
                ? 'border-red-400 bg-red-50'
                : 'border-gray-200 focus:border-accent text-charcoal',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-xs text-center -mt-2">{error}</p>
      )}

      {/* Verify button */}
      <button
        type="submit"
        disabled={!isFilled || loading}
        className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-charcoal font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Spinner />}
        {loading ? 'در حال بررسی...' : 'تأیید کد'}
      </button>

      {/* Back + resend row */}
      <div className="flex items-center justify-between text-sm pt-1">
        {/* Back to phone step */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-charcoal transition-colors"
        >
          {/* chevron-right in RTL context points "back" */}
          <svg
            className="w-4 h-4 rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          تغییر شماره
        </button>

        {/* Resend / countdown */}
        {countdown > 0 ? (
          <span className="text-gray-400 tabular-nums" dir="ltr">
            ارسال مجدد ({countdown}s)
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-accent-dark font-semibold hover:underline disabled:opacity-50 transition-colors"
          >
            {resending ? 'در حال ارسال...' : 'ارسال مجدد کد'}
          </button>
        )}
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
