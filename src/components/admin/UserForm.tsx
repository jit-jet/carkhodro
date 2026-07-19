"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateUser,
  uploadUserAvatarAdmin,
  removeUserAvatarAdmin,
  type AdminUserUpdateInput,
} from "@/actions/admin-users";
import { USER_ROLE_FA } from "@/src/lib/user-labels";
import { ASSIGNABLE_ROLES } from "@/src/lib/admin-options";
import { JALALI_MONTHS } from "@/src/lib/jalali-convert";
import { useCartUI } from "@/src/store/cart-ui";
import Avatar from "@/src/components/dashboard/Avatar";
import {
  Button,
  Card,
  FormError,
  FormSuccess,
  Input,
  Label,
  Select,
  Textarea,
} from "@/src/components/admin/AdminUI";
import type { UserRole } from "@/generated/prisma_client";
import type { ProvinceVM } from "@/src/lib/serializers";

export interface UserFormInitial {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  shopName: string | null;
  referredBy: string | null;
  activityField: string | null;
  partnerCode: string | null;
  profileImage: string | null;
  accountBalanceToman: number;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  provinceId: number | null;
  cityId: number | null;
  street: string;
  postalCode: string;
  createdAtLabel: string;
}

const YEARS = Array.from({ length: 90 }, (_, i) => 1404 - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function UserForm({
  initial,
  provinces,
}: {
  initial: UserFormInitial;
  provinces: ProvinceVM[];
}) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState<string | null>(initial.profileImage);
  const [phoneNumber, setPhoneNumber] = useState(initial.phoneNumber);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [role, setRole] = useState<UserRole>(
    ASSIGNABLE_ROLES.includes(initial.role) ? initial.role : "RETAIL",
  );
  const [isVerified, setIsVerified] = useState(initial.isVerified);
  const [shopName, setShopName] = useState(initial.shopName ?? "");
  const [referredBy, setReferredBy] = useState(initial.referredBy ?? "");
  const [activityField, setActivityField] = useState(initial.activityField ?? "");
  const [partnerCode, setPartnerCode] = useState(initial.partnerCode ?? "");
  const [accountBalanceToman, setAccountBalanceToman] = useState(
    String(initial.accountBalanceToman ?? 0),
  );
  const [birthYear, setBirthYear] = useState(initial.birthYear);
  const [birthMonth, setBirthMonth] = useState(initial.birthMonth);
  const [birthDay, setBirthDay] = useState(initial.birthDay);
  const [provinceId, setProvinceId] = useState<number | "">(initial.provinceId ?? "");
  const [cityId, setCityId] = useState<number | "">(initial.cityId ?? "");
  const [street, setStreet] = useState(initial.street);
  const [postalCode, setPostalCode] = useState(initial.postalCode);

  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [success, setSuccess] = useState("");
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
      const result = await uploadUserAvatarAdmin(initial.id, form);
      if (!result.ok) {
        setAvatarError(result.error);
        return;
      }
      setAvatar(result.data.url);
      notify({
        variant: "success",
        title: "آواتار به‌روز شد",
        description: "تصویر پروفایل ذخیره شد.",
      });
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleRemoveAvatar() {
    setAvatarError("");
    startAvatar(async () => {
      const result = await removeUserAvatarAdmin(initial.id);
      if (!result.ok) {
        setAvatarError(result.error);
        return;
      }
      setAvatar(null);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const input: AdminUserUpdateInput = {
      phoneNumber,
      firstName,
      lastName,
      role,
      isVerified,
      shopName: shopName || null,
      referredBy: referredBy || null,
      activityField: activityField || null,
      partnerCode: partnerCode || null,
      accountBalanceToman: Number(accountBalanceToman) || 0,
      birthYear,
      birthMonth,
      birthDay,
      provinceId: provinceId === "" ? null : Number(provinceId),
      cityId: cityId === "" ? null : Number(cityId),
      street,
      postalCode,
    };

    startTransition(async () => {
      const result = await updateUser(initial.id, input);
      if (!result.ok) return setError(result.error);
      const message = "اطلاعات کاربر با موفقیت ذخیره شد.";
      setSuccess(message);
      notify({ variant: "success", title: "ذخیره موفق", description: message });
      router.refresh();
    });
  }

  const cities = provinces.find((p) => p.id === provinceId)?.cities ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}
      {success && <FormSuccess message={success} />}

      <Card className="p-5 sm:p-6">
        <div className="grid lg:grid-cols-[200px_1fr] gap-8">
          <div className="flex flex-col items-center gap-3">
            <Avatar
              src={avatar}
              size={140}
              alt={`${firstName} ${lastName}`.trim() || "کاربر"}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => fileRef.current?.click()}
                disabled={avatarPending}
                className="!py-2 !text-xs"
              >
                انتخاب عکس
              </Button>
              {avatar && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleRemoveAvatar}
                  disabled={avatarPending}
                  className="!py-2 !text-xs"
                >
                  حذف عکس
                </Button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 text-center">jpg — حداکثر ۱ مگابایت</p>
            {avatarError && <p className="text-[11px] text-red-500 text-center">{avatarError}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-charcoal">اطلاعات پایه</h2>
              <p className="text-xs text-gray-400">عضویت: {initial.createdAtLabel}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>نام</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <Label>نام خانوادگی</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div>
                <Label>موبایل</Label>
                <Input
                  dir="ltr"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  required
                />
              </div>
              <div>
                <Label>نقش</Label>
                <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)} required>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {USER_ROLE_FA[r]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>نام فروشگاه</Label>
                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
              </div>
              <div>
                <Label>کد اختصاصی</Label>
                <Input
                  dir="ltr"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  disabled={role === "RETAIL"}
                  placeholder={role === "RETAIL" ? "فقط برای همکار" : ""}
                />
              </div>
              <div>
                <Label>معرف</Label>
                <Input value={referredBy} onChange={(e) => setReferredBy(e.target.value)} />
              </div>
              <div>
                <Label>زمینه فعالیت</Label>
                <Input value={activityField} onChange={(e) => setActivityField(e.target.value)} />
              </div>
              <div>
                <Label>مانده حساب (تومان)</Label>
                <Input
                  type="number"
                  value={accountBalanceToman}
                  onChange={(e) => setAccountBalanceToman(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>تاریخ تولد</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
                  <option value="">روز</option>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d.toLocaleString("fa-IR")}
                    </option>
                  ))}
                </Select>
                <Select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                  <option value="">ماه</option>
                  {JALALI_MONTHS.slice(1).map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </Select>
                <Select value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                  <option value="">سال</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y.toLocaleString("fa-IR", { useGrouping: false })}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              تأیید شده
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="font-bold text-charcoal">آدرس</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>استان</Label>
            <Select
              value={provinceId}
              onChange={(e) => {
                setProvinceId(e.target.value ? Number(e.target.value) : "");
                setCityId("");
              }}
            >
              <option value="">انتخاب استان…</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>شهر</Label>
            <Select
              value={cityId}
              onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : "")}
              disabled={!provinceId}
            >
              <option value="">انتخاب شهر…</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>آدرس تفصیلی</Label>
            <Textarea
              rows={2}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="خیابان، کوچه، پلاک، واحد…"
            />
          </div>
          <div>
            <Label>کد پستی</Label>
            <Input
              dir="ltr"
              inputMode="numeric"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="۱۰ رقم"
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || avatarPending}>
          {pending ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/users")}>
          بازگشت
        </Button>
      </div>
    </form>
  );
}
