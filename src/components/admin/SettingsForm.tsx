"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings, type SiteSettingVM } from "@/actions/admin-settings";
import { Button, Card, FormError, FormSuccess, Input, Label, Textarea } from "@/src/components/admin/AdminUI";

export default function SettingsForm({ initial }: { initial: SiteSettingVM }) {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}
      {success && <FormSuccess message="اطلاعات با موفقیت ذخیره شد." />}

      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="font-bold text-charcoal">اطلاعات تماس</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>تلفن اصلی</Label>
            <Input dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="021xxxxxxx" />
          </div>
          <div>
            <Label>تلفن دوم (اختیاری)</Label>
            <Input dir="ltr" value={form.secondaryPhone} onChange={(e) => set("secondaryPhone", e.target.value)} />
          </div>
          <div>
            <Label>ایمیل</Label>
            <Input dir="ltr" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <Label>ساعات کاری</Label>
            <Input value={form.workingHours} onChange={(e) => set("workingHours", e.target.value)} placeholder="شنبه تا پنجشنبه، ۹ تا ۱۸" />
          </div>
        </div>
        <div>
          <Label>آدرس</Label>
          <Textarea rows={3} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
      </Card>

      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="font-bold text-charcoal">شبکه‌های اجتماعی</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>اینستاگرام</Label>
            <Input dir="ltr" value={form.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/…" />
          </div>
          <div>
            <Label>تلگرام</Label>
            <Input dir="ltr" value={form.telegramUrl} onChange={(e) => set("telegramUrl", e.target.value)} placeholder="https://t.me/…" />
          </div>
          <div>
            <Label>واتساپ</Label>
            <Input dir="ltr" value={form.whatsappUrl} onChange={(e) => set("whatsappUrl", e.target.value)} placeholder="https://wa.me/…" />
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="font-bold text-charcoal">درباره ما</h2>
        <Textarea rows={5} value={form.aboutText} onChange={(e) => set("aboutText", e.target.value)} placeholder="متنی که در صفحه درباره ما نمایش داده می‌شود…" />
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? "در حال ذخیره…" : "ذخیره تنظیمات"}
      </Button>
    </form>
  );
}
