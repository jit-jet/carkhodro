'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  /** Called when the user submits a valid phone number */
  onSubmit: (phoneNumber: string) => Promise<void>;
  loading: boolean;
  error: string;
}

/** Iranian mobile regex: starts with 09, exactly 11 digits */
const PHONE_RE = /^09\d{9}$/;

export default function PhoneStep({ onSubmit, loading, error }: Props) {
  const [phone, setPhone] = useState('');

  const isValid = PHONE_RE.test(phone);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    await onSubmit(phone);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Phone input */}
      <div>
        <label
          htmlFor="phone-input"
          className="block text-sm font-semibold text-charcoal mb-2"
        >
          شماره موبایل
        </label>
        <input
          id="phone-input"
          dir="ltr"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\s/g, ''))}
          placeholder="09XXXXXXXXX"
          maxLength={11}
          autoFocus
          autoComplete="tel"
          className={[
            'w-full border-2 rounded-xl px-4 py-3 text-base text-center font-mono',
            'tracking-widest focus:outline-none transition-colors placeholder-gray-300',
            error
              ? 'border-red-400 bg-red-50'
              : 'border-silver focus:border-accent',
          ].join(' ')}
        />
        {error ? (
          <p className="text-red-500 text-xs mt-1.5">{error}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1.5">
            کد تأیید به این شماره ارسال می‌شود.
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-charcoal font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Spinner />}
        {loading ? 'در حال ارسال...' : 'ارسال کد تأیید'}
      </button>

      {/* Rules reminder */}
      <p className="text-center text-xs text-gray-400 leading-5">
        با ورود، <Link href="/rules" className="text-accent-dark hover:underline font-medium">قوانین و مقررات</Link> کارخودرو را می‌پذیرید.
      </p>
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
