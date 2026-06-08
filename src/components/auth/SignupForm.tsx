'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IRANIAN_PROVINCES } from '@/src/data/mockUsers';
import { registerUser } from '@/actions/auth';

// ── Field-level form state ─────────────────────────────────────────────────────

interface FormState {
  firstName: string;
  lastName: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  acceptedRules: boolean;
}

const INITIAL: FormState = {
  firstName: '',
  lastName: '',
  province: '',
  city: '',
  address: '',
  postalCode: '',
  acceptedRules: false,
};

// ── Validation rules ───────────────────────────────────────────────────────────

function validate(f: FormState): Partial<Record<keyof FormState, string>> {
  return {
    firstName:     !f.firstName.trim()                   ? 'نام الزامی است.'                     : '',
    lastName:      !f.lastName.trim()                    ? 'نام خانوادگی الزامی است.'             : '',
    province:      !f.province                           ? 'لطفاً استان را انتخاب کنید.'         : '',
    city:          !f.city.trim()                        ? 'شهر الزامی است.'                    : '',
    address:       !f.address.trim()                     ? 'آدرس الزامی است.'                   : '',
    postalCode:    !/^\d{10}$/.test(f.postalCode)        ? 'کد پستی باید دقیقاً ۱۰ رقم باشد.'   : '',
    acceptedRules: !f.acceptedRules                      ? 'پذیرش قوانین الزامی است.'           : '',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  /** Phone number already verified in the OTP step — passed as read-only */
  phoneNumber: string;
  /** Where to send the user after a successful signup (defaults to dashboard). */
  redirectTo?: string;
}

export default function SignupForm({ phoneNumber, redirectTo = '/dashboard' }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const errors = validate(form);
  const isValid = Object.values(errors).every((e) => !e);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function touch(key: keyof FormState) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function touchAll() {
    const all: Partial<Record<keyof FormState, boolean>> = {};
    (Object.keys(INITIAL) as (keyof FormState)[]).forEach((k) => { all[k] = true; });
    setTouched(all);
  }

  function fieldError(key: keyof FormState): string {
    return touched[key] ? (errors[key] ?? '') : '';
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    touchAll();
    if (!isValid || loading) return;

    setLoading(true);
    setServerError('');
    try {
      const res = await registerUser({
        phoneNumber,
        firstName:  form.firstName.trim(),
        lastName:   form.lastName.trim(),
        province:   form.province,
        city:       form.city.trim(),
        address:    form.address.trim(),
        postalCode: form.postalCode,
      });

      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      // Registration complete (session set, guest cart merged) → continue.
      router.push(redirectTo);
      router.refresh();
    } catch {
      setServerError('خطا در اتصال. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">

      {/* Verified phone — read-only */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
          شماره موبایل تأیید‌شده
        </label>
        <div
          dir="ltr"
          className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-mono text-center bg-gray-50 text-gray-500 tracking-widest"
        >
          {phoneNumber || '—'}
        </div>
      </div>

      {/* First name + Last name side by side */}
      <div className="grid grid-cols-2 gap-3">
        <Field
          id="firstName"
          label="نام"
          value={form.firstName}
          onChange={(v) => set('firstName', v)}
          onBlur={() => touch('firstName')}
          placeholder="مثال: علی"
          error={fieldError('firstName')}
        />
        <Field
          id="lastName"
          label="نام خانوادگی"
          value={form.lastName}
          onChange={(v) => set('lastName', v)}
          onBlur={() => touch('lastName')}
          placeholder="مثال: محمدی"
          error={fieldError('lastName')}
        />
      </div>

      {/* Province dropdown */}
      <div>
        <label htmlFor="province" className="block text-sm font-semibold text-charcoal mb-1.5">
          استان
        </label>
        <select
          id="province"
          value={form.province}
          onChange={(e) => set('province', e.target.value)}
          onBlur={() => touch('province')}
          className={inputCls(!!fieldError('province'))}
        >
          <option value="">انتخاب استان…</option>
          {IRANIAN_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {fieldError('province') && <FieldError msg={fieldError('province')} />}
      </div>

      {/* City */}
      <Field
        id="city"
        label="شهر"
        value={form.city}
        onChange={(v) => set('city', v)}
        onBlur={() => touch('city')}
        placeholder="مثال: تهران"
        error={fieldError('city')}
      />

      {/* Address — textarea */}
      <div>
        <label htmlFor="address" className="block text-sm font-semibold text-charcoal mb-1.5">
          آدرس تفصیلی
        </label>
        <textarea
          id="address"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          onBlur={() => touch('address')}
          placeholder="خیابان، کوچه، پلاک، واحد…"
          rows={3}
          className={inputCls(!!fieldError('address')) + ' resize-none'}
        />
        {fieldError('address') && <FieldError msg={fieldError('address')} />}
      </div>

      {/* Postal code */}
      <Field
        id="postalCode"
        label="کد پستی"
        value={form.postalCode}
        onChange={(v) => set('postalCode', v.replace(/\D/g, '').slice(0, 10))}
        onBlur={() => touch('postalCode')}
        placeholder="۱۰ رقم"
        inputMode="numeric"
        dir="ltr"
        error={fieldError('postalCode')}
      />

      {/* Rules checkbox */}
      <div className="pt-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.acceptedRules}
            onChange={(e) => { set('acceptedRules', e.target.checked); touch('acceptedRules'); }}
            className="mt-0.5 w-4 h-4 accent-[#F4C232] shrink-0 cursor-pointer"
          />
          <span className="text-sm text-gray-600 leading-6">
            <Link
              href="/rules"
              target="_blank"
              className="text-accent-dark font-semibold hover:underline"
            >
              قوانین و مقررات
            </Link>{' '}
            کارخودرو را خوانده و می‌پذیرم.
          </span>
        </label>
        {fieldError('acceptedRules') && <FieldError msg={fieldError('acceptedRules')} />}
      </div>

      {/* Server-level error banner */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-charcoal font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
      >
        {loading && <Spinner />}
        {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام و ورود'}
      </button>
    </form>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    'w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors bg-white',
    hasError ? 'border-red-400 bg-red-50' : 'border-silver focus:border-accent',
  ].join(' ');
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  dir?: string;
}

function Field({
  id, label, value, onChange, onBlur, placeholder, error, inputMode, dir,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-charcoal mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        dir={dir}
        className={inputCls(!!error)}
      />
      {error && <FieldError msg={error} />}
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="text-red-500 text-xs mt-1">{msg}</p>;
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
