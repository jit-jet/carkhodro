"use client";

/**
 * Partner profile form.
 * ─────────────────────
 * Editable: full name, store name, activity field and delivery address.
 * Read-only: username, mobile and user type.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateProfile } from "@/actions/dashboard-profile";
import { useCartUI } from "@/src/store/cart-ui";
import type { ProfileVM } from "@/src/lib/dashboard-types";
import type { ProvinceVM } from "@/src/lib/serializers";

export default function ProfileForm({
  profile,
  provinces,
  readOnly = false,
}: {
  profile: ProfileVM;
  provinces: ProvinceVM[];
  readOnly?: boolean;
}) {
  const [fullName, setFullName] = useState(
    `${profile.firstName} ${profile.lastName}`.trim(),
  );
  const [shopName, setShopName] = useState(profile.shopName);
  const [activityField, setActivityField] = useState(profile.activityField);
  const [provinceId, setProvinceId] = useState<number | "">(
    profile.provinceId ?? "",
  );
  const [cityId, setCityId] = useState<number | "">(profile.cityId ?? "");
  const [street, setStreet] = useState(profile.street);
  const [postalCode, setPostalCode] = useState(profile.postalCode);

  const notify = useCartUI((s) => s.notify);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const trimmed = fullName.trim();
    if (!trimmed) {
      notify({
        variant: "error",
        title: "خطا",
        description: "نام کامل را وارد کنید.",
      });
      return;
    }
    const [firstName, ...rest] = trimmed.split(/\s+/);
    startTransition(async () => {
      const result = await updateProfile({
        firstName,
        lastName: rest.join(" "),
        shopName,
        activityField,
        provinceId: provinceId || null,
        cityId: cityId || null,
        street,
        postalCode,
      });
      if (!result.ok) {
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: "ذخیره موفق",
        description: "اطلاعات با موفقیت ذخیره شد.",
      });
    });
  }

  return (
    <form
      onSubmit={submit}
      className={[
        "rounded-2xl border shadow-sm p-5 sm:p-7 transition-colors",
        readOnly ? "bg-gray-100 border-gray-200" : "bg-white border-gray-100",
      ].join(" ")}
    >
      <h1 className="text-lg font-extrabold text-charcoal mb-6">پروفایل من</h1>

      {readOnly && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-950">
          کاربران همکار امکان ویرایش اطلاعات حساب خود را ندارند. برای اعمال تغییرات لطفاً با{' '}
          <Link href="/contact" className="font-bold underline underline-offset-2">
            پشتیبانی
          </Link>{' '}
          تماس بگیرید.
        </div>
      )}

      <div className="space-y-6">
        {/* Fields column */}
        <section className="space-y-4">
          {/* Read-only account info */}
          <div className="grid sm:grid-cols-2 gap-3">
            <ReadOnly label="نام کاربری" value={profile.phoneNumber} ltr />
            <ReadOnly label="موبایل" value={profile.phoneNumber} ltr />
            <ReadOnly label="نوع کاربر" value={profile.userType} />
          </div>

          <Field
            label="نام کامل"
            value={fullName}
            onChange={setFullName}
            placeholder="مثال: محسن محمدی"
            disabled={readOnly}
          />
          <Field
            label="نام فروشگاه"
            value={shopName}
            onChange={setShopName}
            placeholder="نام فروشگاه خود را وارد کنید…"
            disabled={readOnly}
          />
          <Field
            label="زمینه فعالیت"
            value={activityField}
            onChange={setActivityField}
            placeholder="زمینه فعالیت خود را شرح دهید…"
            disabled={readOnly}
          />

          {/* Address */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm font-bold text-charcoal mb-3 mt-3">آدرس</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">
                  استان
                </label>
                <select
                  value={provinceId}
                  onChange={(e) => {
                    setProvinceId(e.target.value ? Number(e.target.value) : "");
                    setCityId(""); // reset city when province changes
                  }}
                  disabled={readOnly}
                  className={selectCls}
                >
                  <option value="">انتخاب استان…</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">
                  شهر
                </label>
                <select
                  value={cityId}
                  onChange={(e) =>
                    setCityId(e.target.value ? Number(e.target.value) : "")
                  }
                  disabled={readOnly || !provinceId}
                  className={selectCls}
                >
                  <option value="">انتخاب شهر…</option>
                  {(
                    provinces.find((p) => p.id === provinceId)?.cities ?? []
                  ).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-semibold text-charcoal mb-1.5">
                آدرس تفصیلی
              </label>
              <textarea
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                disabled={readOnly}
                rows={2}
                placeholder="خیابان، کوچه، پلاک، واحد…"
                className={`${selectCls} resize-none`}
              />
            </div>
            <div className="mt-3">
              <Field
                label="کد پستی"
                value={postalCode}
                onChange={(v) =>
                  setPostalCode(v.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="۱۰ رقم"
                dir="ltr"
                inputMode="numeric"
                disabled={readOnly}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending || readOnly}
            className="bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm px-8 py-3 rounded-xl transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-80"
          >
            {readOnly ? "ویرایش اطلاعات غیرفعال است" : pending ? "در حال ذخیره…" : "ذخیره اطلاعات"}
          </button>
        </section>
      </div>
    </form>
  );
}

const selectCls =
  "w-full border-2 border-silver focus:border-accent rounded-xl px-4 py-2.5 text-sm outline-none transition-colors bg-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-500 disabled:opacity-100";

function Field({
  label,
  value,
  onChange,
  placeholder,
  dir,
  inputMode,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-charcoal mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        inputMode={inputMode}
        disabled={disabled}
        className={selectCls}
      />
    </div>
  );
}

function ReadOnly({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-charcoal mb-1.5">
        {label}
      </label>
      <div
        dir={ltr ? "ltr" : undefined}
        className={[
          "w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500",
          ltr ? "text-right" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
