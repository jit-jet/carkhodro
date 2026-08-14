"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateUser,
  type AdminUserUpdateInput,
} from "@/actions/admin-users";
import { USER_ROLE_FA } from "@/src/lib/user-labels";
import { ASSIGNABLE_ROLES } from "@/src/lib/admin-options";
import { useCartUI } from "@/src/store/cart-ui";
import {
  Button,
  Card,
  CardHeader,
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
  isActive: boolean;
  shopName: string | null;
  activityField: string | null;
  accountBalanceToman: number;
  provinceId: number | null;
  cityId: number | null;
  street: string;
  postalCode: string;
  createdAtLabel: string;
}

export default function UserForm({
  initial,
  provinces,
}: {
  initial: UserFormInitial;
  provinces: ProvinceVM[];
}) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const phoneNumber = initial.phoneNumber;
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [role, setRole] = useState<UserRole>(
    ASSIGNABLE_ROLES.includes(initial.role) ? initial.role : "RETAIL",
  );
  const isVerified = initial.isVerified;
  const [isActive, setIsActive] = useState(initial.isActive);
  const [shopName, setShopName] = useState(initial.shopName ?? "");
  const [activityField, setActivityField] = useState(initial.activityField ?? "");
  const [accountBalanceToman, setAccountBalanceToman] = useState(
    String(initial.accountBalanceToman ?? 0),
  );
  const [provinceId, setProvinceId] = useState<number | "">(initial.provinceId ?? "");
  const [cityId, setCityId] = useState<number | "">(initial.cityId ?? "");
  const [street, setStreet] = useState(initial.street);
  const [postalCode, setPostalCode] = useState(initial.postalCode);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

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
      isActive,
      shopName: shopName || null,
      activityField: activityField || null,
      accountBalanceToman: Number(accountBalanceToman) || 0,
      provinceId: provinceId === "" ? null : Number(provinceId),
      cityId: cityId === "" ? null : Number(cityId),
      street,
      postalCode,
    };

    startTransition(async () => {
      const result = await updateUser(initial.id, input);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
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

      <Card className="overflow-hidden p-5 sm:p-6">
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-charcoal">اطلاعات پایه</h2>
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
                  disabled
                  readOnly
                  title="شماره موبایل قابل تغییر نیست"
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

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <fieldset className="flex items-center gap-4">
                <legend className="sr-only">وضعیت حساب</legend>
                <span className="text-sm font-semibold text-charcoal">وضعیت:</span>
                <label className="flex items-center gap-1.5 text-sm text-charcoal cursor-pointer">
                  <input
                    type="radio"
                    name="user-status"
                    checked={isActive}
                    onChange={() => setIsActive(true)}
                    className="accent-accent"
                  />
                  فعال
                </label>
                <label className="flex items-center gap-1.5 text-sm text-charcoal cursor-pointer">
                  <input
                    type="radio"
                    name="user-status"
                    checked={!isActive}
                    onChange={() => setIsActive(false)}
                    className="accent-accent"
                  />
                  غیرفعال
                </label>
              </fieldset>
            </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="آدرس" />
        <div className="p-5 sm:p-6 space-y-4">
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
        </div>
      </Card>

      <div className="flex items-center gap-3 sticky bottom-4 z-10 bg-white/90 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-sm px-4 py-3 w-fit">
        <Button type="submit" disabled={pending}>
          {pending ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/users")}>
          بازگشت
        </Button>
      </div>
    </form>
  );
}
