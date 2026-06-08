'use client';

/**
 * Checkout — buyer contact + delivery details.
 * ─────────────────────────────────────────────
 * Two modes, driven by the parent <CheckoutView>:
 *   • Saved view  — when the user already has a complete profile/address, their
 *                   details are shown read-only with an «ویرایش» (edit) button.
 *   • Edit form   — when data is missing (forced) or the user clicked edit, the
 *                   fields become editable. The verified account phone is always
 *                   read-only.
 *
 * State is lifted to the parent so the place-order action can read the current
 * values; this component is presentational + reports edits via `onChange`.
 */

import { IRANIAN_PROVINCES } from '@/src/data/mockUsers';
import type { CheckoutContact } from '@/src/lib/serializers';

type FieldErrors = Partial<Record<keyof CheckoutContact, string>>;

interface Props {
  value: CheckoutContact;
  onChange: (patch: Partial<CheckoutContact>) => void;
  phoneNumber: string;
  editing: boolean;
  onEdit: () => void;
  errors: FieldErrors;
}

export default function CheckoutInfoForm({
  value,
  onChange,
  phoneNumber,
  editing,
  onEdit,
  errors,
}: Props) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-accent-dark shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h2 className="font-semibold text-charcoal">اطلاعات گیرنده و آدرس</h2>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 text-xs font-semibold text-accent-dark hover:underline"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            ویرایش
          </button>
        )}
      </div>

      <div className="p-5">
        {editing ? (
          <EditForm value={value} onChange={onChange} phoneNumber={phoneNumber} errors={errors} />
        ) : (
          <SavedView value={value} phoneNumber={phoneNumber} />
        )}
      </div>
    </section>
  );
}

// ── Saved (read-only) view ──────────────────────────────────────────────────

function SavedView({ value, phoneNumber }: { value: CheckoutContact; phoneNumber: string }) {
  return (
    <div className="space-y-3 text-sm">
      <Detail label="نام و نام خانوادگی" value={`${value.firstName} ${value.lastName}`} />
      <Detail label="شماره موبایل" value={phoneNumber} ltr />
      <Detail label="استان / شهر" value={`${value.province}، ${value.city}`} />
      <Detail label="آدرس" value={value.street} />
      <Detail label="کد پستی" value={value.postalCode} ltr />
    </div>
  );
}

function Detail({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span
        dir={ltr ? 'ltr' : undefined}
        className="font-medium text-charcoal text-left leading-6"
      >
        {value || '—'}
      </span>
    </div>
  );
}

// ── Edit form ────────────────────────────────────────────────────────────────

function EditForm({
  value,
  onChange,
  phoneNumber,
  errors,
}: {
  value: CheckoutContact;
  onChange: (patch: Partial<CheckoutContact>) => void;
  phoneNumber: string;
  errors: FieldErrors;
}) {
  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-2 gap-3">
        <Field
          id="firstName"
          label="نام"
          value={value.firstName}
          onChange={(v) => onChange({ firstName: v })}
          placeholder="مثال: علی"
          error={errors.firstName}
        />
        <Field
          id="lastName"
          label="نام خانوادگی"
          value={value.lastName}
          onChange={(v) => onChange({ lastName: v })}
          placeholder="مثال: محمدی"
          error={errors.lastName}
        />
      </div>

      {/* Province */}
      <div>
        <label htmlFor="province" className="block text-sm font-semibold text-charcoal mb-1.5">
          استان
        </label>
        <select
          id="province"
          value={value.province}
          onChange={(e) => onChange({ province: e.target.value })}
          className={inputCls(!!errors.province)}
        >
          <option value="">انتخاب استان…</option>
          {IRANIAN_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.province && <FieldError msg={errors.province} />}
      </div>

      <Field
        id="city"
        label="شهر"
        value={value.city}
        onChange={(v) => onChange({ city: v })}
        placeholder="مثال: تهران"
        error={errors.city}
      />

      {/* Street — textarea */}
      <div>
        <label htmlFor="street" className="block text-sm font-semibold text-charcoal mb-1.5">
          آدرس تفصیلی
        </label>
        <textarea
          id="street"
          value={value.street}
          onChange={(e) => onChange({ street: e.target.value })}
          placeholder="خیابان، کوچه، پلاک، واحد…"
          rows={3}
          className={inputCls(!!errors.street) + ' resize-none'}
        />
        {errors.street && <FieldError msg={errors.street} />}
      </div>

      <Field
        id="postalCode"
        label="کد پستی"
        value={value.postalCode}
        onChange={(v) => onChange({ postalCode: v.replace(/\D/g, '').slice(0, 10) })}
        placeholder="۱۰ رقم"
        inputMode="numeric"
        dir="ltr"
        error={errors.postalCode}
      />
    </div>
  );
}

// ── Shared field primitives (mirrors SignupForm styling) ─────────────────────

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
  placeholder?: string;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  dir?: string;
}

function Field({ id, label, value, onChange, placeholder, error, inputMode, dir }: FieldProps) {
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
