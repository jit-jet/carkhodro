"use client";

/**
 * Partner profile form.
 * ─────────────────────
 * Editable: avatar (jpg → public/storage/avatars) upload/remove, full name, store name, referrer,
 * Jalali birth date, activity field and delivery address. Read-only: username,
 * mobile, special code and user type. Avatar upload/remove call their own
 * actions for instant feedback; the rest saves through `updateProfile`.
 */

import { useState, useRef, useTransition } from "react";
import Avatar from "@/src/components/dashboard/Avatar";
import {
  updateProfile,
  updateAvatar,
  removeAvatar,
} from "@/actions/dashboard-profile";
import { JALALI_MONTHS } from "@/src/lib/jalali-convert";
import type { ProfileVM } from "@/src/lib/dashboard-types";
import type { ProvinceVM } from "@/src/lib/serializers";

const YEARS = Array.from({ length: 90 }, (_, i) => 1404 - i); // 1404 … 1315
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function ProfileForm({
  profile,
  provinces,
}: {
  profile: ProfileVM;
  provinces: ProvinceVM[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState<string | null>(profile.profileImage);
  const [fullName, setFullName] = useState(
    `${profile.firstName} ${profile.lastName}`.trim(),
  );
  const [shopName, setShopName] = useState(profile.shopName);
  const [referredBy, setReferredBy] = useState(profile.referredBy);
  const [activityField, setActivityField] = useState(profile.activityField);
  const [birthYear, setBirthYear] = useState(profile.birthYear);
  const [birthMonth, setBirthMonth] = useState(profile.birthMonth);
  const [birthDay, setBirthDay] = useState(profile.birthDay);
  const [provinceId, setProvinceId] = useState<number | "">(
    profile.provinceId ?? "",
  );
  const [cityId, setCityId] = useState<number | "">(profile.cityId ?? "");
  const [street, setStreet] = useState(profile.street);
  const [postalCode, setPostalCode] = useState(profile.postalCode);

  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [avatarPending, startAvatar] = useTransition();

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/jpeg") {
      setAvatarError("تصویر باید با پسوند jpg باشد.");
      return;
    }
    const form = new FormData();
    form.set("avatar", file);
    startAvatar(async () => {
      const result = await updateAvatar(form);
      if (!result.ok) {
        setAvatarError(result.error);
        return;
      }
      // Show the new image immediately from the local file.
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleRemoveAvatar() {
    startAvatar(async () => {
      const result = await removeAvatar();
      if (result.ok) setAvatar(null);
      else setAvatarError(result.error);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const trimmed = fullName.trim();
    if (!trimmed) {
      setError("نام کامل را وارد کنید.");
      return;
    }
    const [firstName, ...rest] = trimmed.split(/\s+/);
    startTransition(async () => {
      const result = await updateProfile({
        firstName,
        lastName: rest.join(" "),
        shopName,
        referredBy,
        activityField,
        birthYear,
        birthMonth,
        birthDay,
        provinceId: provinceId || null,
        cityId: cityId || null,
        street,
        postalCode,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7"
    >
      <h1 className="text-lg font-extrabold text-charcoal mb-6">پروفایل من</h1>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        {/* Avatar column */}
        <div className="flex flex-col items-center gap-3">
          <Avatar src={avatar} size={140} alt={fullName} />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg"
            onChange={handleAvatarChange}
            className="hidden"
            id="avatar-input"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarPending}
              className="text-xs font-semibold text-charcoal bg-silver-light hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              انتخاب عکس
            </button>
            {avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarPending}
                className="text-xs font-semibold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                حذف عکس
              </button>
            )}
          </div>
          <p className="text-[11px] text-gray-400 text-center">
            تصویر باید با پسوند jpg باشد
          </p>
          {avatarError && (
            <p className="text-[11px] text-red-500 text-center">
              {avatarError}
            </p>
          )}
        </div>

        {/* Fields column */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl px-4 py-3">
              اطلاعات با موفقیت ذخیره شد.
            </div>
          )}

          {/* Read-only account info */}
          <div className="grid sm:grid-cols-2 gap-3">
            <ReadOnly label="نام کاربری" value={profile.phoneNumber} ltr />
            <ReadOnly label="موبایل" value={profile.phoneNumber} ltr />
            <ReadOnly label="کد اختصاصی" value={profile.partnerCode ?? "—"} />
            <ReadOnly label="نوع کاربر" value={profile.userType} />
          </div>

          <Field
            label="نام کامل"
            value={fullName}
            onChange={setFullName}
            placeholder="مثال: محسن محمدی"
          />
          <Field
            label="نام فروشگاه"
            value={shopName}
            onChange={setShopName}
            placeholder="نام فروشگاه خود را وارد کنید…"
          />
          <Field
            label="معرف"
            value={referredBy}
            onChange={setReferredBy}
            placeholder="کسی که کارخودرو را معرفی کرده…"
          />

          {/* Birth date */}
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">
              تاریخ تولد
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className={selectCls}
              >
                <option value="">روز</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d.toLocaleString("fa-IR")}
                  </option>
                ))}
              </select>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className={selectCls}
              >
                <option value="">ماه</option>
                {JALALI_MONTHS.slice(1).map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className={selectCls}
              >
                <option value="">سال</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y.toLocaleString("fa-IR", {
                      useGrouping: false,
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Field
            label="زمینه فعالیت"
            value={activityField}
            onChange={setActivityField}
            placeholder="زمینه فعالیت خود را شرح دهید…"
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
                  disabled={!provinceId}
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
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm px-8 py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {pending ? "در حال ذخیره…" : "ذخیره اطلاعات"}
          </button>
        </div>
      </div>
    </form>
  );
}

const selectCls =
  "w-full border-2 border-silver focus:border-accent rounded-xl px-4 py-2.5 text-sm outline-none transition-colors bg-white";

function Field({
  label,
  value,
  onChange,
  placeholder,
  dir,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
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
