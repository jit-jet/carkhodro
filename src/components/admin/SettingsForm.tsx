"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings, type SiteSettingVM } from "@/actions/admin-settings";
import {
  Button,
  Card,
  CardHeader,
  FormError,
  FormSuccess,
  Input,
  Label,
  Textarea,
} from "@/src/components/admin/AdminUI";
import ImageUploadField from "@/src/components/admin/ImageUploadField";
import { useCartUI } from "@/src/store/cart-ui";

export default function SettingsForm({ initial }: { initial: SiteSettingVM }) {
  const notify = useCartUI((s) => s.notify);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof SiteSettingVM>(key: K, value: SiteSettingVM[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    startTransition(async () => {
      const { footerTrustBadges: _badges, ...settingsFields } = form;
      const result = await updateSiteSettings(settingsFields);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setSuccess(true);
      notify({
        variant: "success",
        title: "ذخیره موفق",
        description: "اطلاعات با موفقیت ذخیره شد.",
      });
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <FormError message={error} />}
        {success && <FormSuccess message="اطلاعات با موفقیت ذخیره شد." />}

        <Card className="overflow-hidden">
          <CardHeader
            title="هویت و برند سایت"
            description="نام سایت، لوگو، آیکون‌ها و متن کپی‌رایت. تنظیمات سئو در منوی سئو مدیریت می‌شوند."
          />
          <div className="p-5 sm:p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>نام سایت</Label>
                <Input
                  value={form.siteName}
                  onChange={(e) => set("siteName", e.target.value)}
                  placeholder="کارخودرو"
                />
              </div>
              <div>
                <Label>متن کپی‌رایت</Label>
                <Input
                  value={form.copyrightText}
                  onChange={(e) => set("copyrightText", e.target.value)}
                  placeholder="© ۱۴۰۳ کارخودرو — تمامی حقوق محفوظ است."
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <ImageUploadField
                folder="settings"
                label="لوگو"
                value={form.logoUrl}
                onChange={(url) => set("logoUrl", url)}
              />
              <ImageUploadField
                folder="settings"
                label="فاویکون"
                value={form.faviconUrl}
                onChange={(url) => set("faviconUrl", url)}
              />
              <ImageUploadField
                folder="settings"
                label="Apple Touch Icon"
                value={form.appleTouchIconUrl}
                onChange={(url) => set("appleTouchIconUrl", url)}
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-charcoal">لوگوی روی تصاویر محصولات</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">این لوگو به‌صورت خودکار روی همه تصاویر محصول در فروشگاه نمایش داده می‌شود. برای نتیجه بهتر از PNG یا WebP با پس‌زمینه شفاف استفاده کنید.</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <ImageUploadField folder="settings" label="فایل لوگوی روی محصول" value={form.productWatermarkUrl} onChange={(url) => set('productWatermarkUrl', url)} />
                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold text-gray-500">محل نمایش لوگو</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ['top-right', 'بالا راست'], ['top-left', 'بالا چپ'],
                        ['bottom-right', 'پایین راست'], ['bottom-left', 'پایین چپ'],
                      ] as const).map(([value, label]) => (
                        <label key={value} className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-colors ${form.productWatermarkPosition === value ? 'border-accent bg-amber-50 text-charcoal ring-1 ring-accent' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                          <input type="radio" name="productWatermarkPosition" value={value} checked={form.productWatermarkPosition === value} onChange={() => set('productWatermarkPosition', value)} className="sr-only" />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-500">پیش‌نمایش</p>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="absolute inset-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200" />
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">تصویر محصول</span>
                    {form.productWatermarkUrl && <img src={form.productWatermarkUrl} alt="پیش‌نمایش لوگو" className={`absolute h-[18%] w-[28%] object-contain ${form.productWatermarkPosition === 'top-right' ? 'top-[3%] right-[3%] object-right object-top' : form.productWatermarkPosition === 'top-left' ? 'top-[3%] left-[3%] object-left object-top' : form.productWatermarkPosition === 'bottom-left' ? 'bottom-[3%] left-[3%] object-left object-bottom' : 'bottom-[3%] right-[3%] object-right object-bottom'}`} /> /* eslint-disable-line @next/next/no-img-element */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="هدر سایت"
            description="متن‌های تبلیغی نوار بالای هدر. آیکون هر متن اختیاری است و در صورت خالی بودن، آیکونی نمایش داده نمی‌شود."
          />
          <div className="p-5 sm:p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label>متن تبلیغی ۱</Label>
                  <Input
                    value={form.headerPromo1}
                    onChange={(e) => set("headerPromo1", e.target.value)}
                    placeholder="ضمانت اصالت کالا"
                  />
                </div>
                <ImageUploadField
                  folder="settings"
                  label="آیکون تبلیغی ۱ (اختیاری)"
                  value={form.headerPromo1Icon}
                  onChange={(url) => set("headerPromo1Icon", url)}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <Label>متن تبلیغی ۲</Label>
                  <Input
                    value={form.headerPromo2}
                    onChange={(e) => set("headerPromo2", e.target.value)}
                    placeholder="ارسال سریع به سراسر کشور"
                  />
                </div>
                <ImageUploadField
                  folder="settings"
                  label="آیکون تبلیغی ۲ (اختیاری)"
                  value={form.headerPromo2Icon}
                  onChange={(url) => set("headerPromo2Icon", url)}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="اطلاعات تماس"
            description="اطلاعات تماس فروشگاه — تلفن‌ها بر اساس نقش کاربر (خرده‌فروشی / عمده‌فروشی) در سایت نمایش داده می‌شوند."
          />
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <Label>شماره دریافت اعلان پیامکی سفارش‌ها</Label>
              <Input
                dir="ltr"
                type="tel"
                inputMode="tel"
                value={form.adminSmsNotificationPhone}
                onChange={(e) => set("adminSmsNotificationPhone", e.target.value)}
                placeholder="09123456789"
              />
              <p className="mt-1.5 text-xs leading-5 text-gray-500">
                پس از پرداخت آنلاین خرده‌فروشی یا ثبت فاکتور همکاری، مشخصات خریدار و لینک فاکتور به این شماره ارسال می‌شود. برای غیرفعال‌کردن اعلان‌ها، فیلد را خالی کنید.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div>
                <p className="text-sm font-semibold text-charcoal mb-3">
                  تلفن‌های خرده‌فروشی
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  برای بازدیدکنندگان مهمان و مشتریان خرده‌فروشی نمایش داده می‌شوند.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>تلفن خرده‌فروشی ۱</Label>
                    <Input
                      dir="ltr"
                      value={form.retailPhone1}
                      onChange={(e) => set("retailPhone1", e.target.value)}
                      placeholder="021xxxxxxx"
                    />
                  </div>
                  <div>
                    <Label>تلفن خرده‌فروشی ۲</Label>
                    <Input
                      dir="ltr"
                      value={form.retailPhone2}
                      onChange={(e) => set("retailPhone2", e.target.value)}
                      placeholder="021xxxxxxx"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-charcoal mb-3">
                تلفن‌های عمده‌فروشی
              </p>
              <p className="text-xs text-gray-500 mb-3">
                فقط برای کاربران عمده‌فروشی واردشده نمایش داده می‌شوند.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>تلفن عمده‌فروشی ۱</Label>
                  <Input
                    dir="ltr"
                    value={form.wholesalePhone1}
                    onChange={(e) => set("wholesalePhone1", e.target.value)}
                    placeholder="021xxxxxxx"
                  />
                </div>
                <div>
                  <Label>تلفن عمده‌فروشی ۲</Label>
                  <Input
                    dir="ltr"
                    value={form.wholesalePhone2}
                    onChange={(e) => set("wholesalePhone2", e.target.value)}
                    placeholder="021xxxxxxx"
                  />
                </div>
                <div>
                  <Label>تلفن عمده‌فروشی ۳</Label>
                  <Input
                    dir="ltr"
                    value={form.wholesalePhone3}
                    onChange={(e) => set("wholesalePhone3", e.target.value)}
                    placeholder="021xxxxxxx"
                  />
                </div>
                <div>
                  <Label>تلفن عمده‌فروشی ۴</Label>
                  <Input
                    dir="ltr"
                    value={form.wholesalePhone4}
                    onChange={(e) => set("wholesalePhone4", e.target.value)}
                    placeholder="021xxxxxxx"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <div>
                <Label>ایمیل</Label>
                <Input
                  dir="ltr"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>ساعات کاری</Label>
                <Textarea
                  rows={2}
                  value={form.workingHours}
                  onChange={(e) => set("workingHours", e.target.value)}
                  placeholder="هر خط یک بازه زمانی"
                />
              </div>
            </div>
            <div>
              <Label>آدرس کامل</Label>
              <Textarea
                rows={3}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="برای چند خط، Enter بزنید"
              />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="درباره فروشگاه (فوتر)"
            description="متن معرفی کوتاه در ستون برند فوتر نمایش داده می‌شود."
          />
          <div className="p-5 sm:p-6">
            <Textarea
              rows={5}
              value={form.aboutText}
              onChange={(e) => set("aboutText", e.target.value)}
              placeholder="متن معرفی فروشگاه…"
            />
          </div>
        </Card>

        <Button type="submit" disabled={pending}>
          {pending ? "در حال ذخیره…" : "ذخیره تنظیمات"}
        </Button>
      </form>
    </div>
  );
}
