"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings, type SiteSettingVM } from "@/actions/admin-settings";
import type { AdminSocialLinkVM } from "@/src/lib/serializers";
import SocialLinksManager from "@/src/components/admin/SocialLinksManager";
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

export default function SettingsForm({
  initial,
  initialSocialLinks,
}: {
  initial: SiteSettingVM;
  initialSocialLinks: AdminSocialLinkVM[];
}) {
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
      const result = await updateSiteSettings(form);
      if (!result.ok) return setError(result.error);
      setSuccess(true);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <FormError message={error} />}
        {success && <FormSuccess message="اطلاعات با موفقیت ذخیره شد." />}

        <Card className="overflow-hidden">
          <CardHeader
            title="هدر سایت"
            description="تلفن و خط اول آدرس (از بخش تماس) در نوار بالای هدر نمایش داده می‌شوند."
          />
          <div className="p-5 sm:p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>متن تبلیغی ۱</Label>
                <Input
                  value={form.headerPromo1}
                  onChange={(e) => set("headerPromo1", e.target.value)}
                  placeholder="ضمانت اصالت کالا"
                />
              </div>
              <div>
                <Label>متن تبلیغی ۲</Label>
                <Input
                  value={form.headerPromo2}
                  onChange={(e) => set("headerPromo2", e.target.value)}
                  placeholder="ارسال سریع به سراسر کشور"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="اطلاعات تماس"
            description="در فوتر، صفحه تماس با ما و سایر بخش‌های سایت استفاده می‌شود."
          />
          <div className="p-5 sm:p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>تلفن اصلی</Label>
                <Input
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="021xxxxxxx"
                />
              </div>
              <div>
                <Label>تلفن دوم (اختیاری)</Label>
                <Input
                  dir="ltr"
                  value={form.secondaryPhone}
                  onChange={(e) => set("secondaryPhone", e.target.value)}
                />
              </div>
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

      <Card className="overflow-hidden">
        <CardHeader
          title="شبکه‌های اجتماعی"
          description="هر لینک بلافاصله پس از افزودن یا ویرایش ذخیره می‌شود — نیازی به دکمه «ذخیره تنظیمات» نیست."
        />
        <div className="p-5 sm:p-6">
          <SocialLinksManager initialLinks={initialSocialLinks} />
        </div>
      </Card>
    </div>
  );
}
