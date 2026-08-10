"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings, type SiteSettingVM } from "@/actions/admin-settings";
import { Button, Card, CardHeader, FormError, FormSuccess, Input, Label, Textarea } from "@/src/components/admin/AdminUI";
import ImageUploadField from "@/src/components/admin/ImageUploadField";

export default function GlobalSeoForm({ initial }: { initial: SiteSettingVM }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof SiteSettingVM>(key: K, value: SiteSettingVM[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <form className="space-y-6" onSubmit={(event) => {
      event.preventDefault(); setError(""); setSaved(false);
      startTransition(async () => {
        const result = await updateSiteSettings({
          metaTitle: form.metaTitle,
          metaDescription: form.metaDescription,
          ogImageUrl: form.ogImageUrl,
          googleAnalyticsId: form.googleAnalyticsId,
          googleTagManagerId: form.googleTagManagerId,
          searchConsoleVerification: form.searchConsoleVerification,
        });
        if (!result.ok) return setError(result.error);
        setSaved(true);
      });
    }}>
      {error && <FormError message={error} />}
      {saved && <FormSuccess message="تنظیمات سئو ذخیره شد." />}
      <Card className="overflow-hidden">
        <CardHeader title="سئوی عمومی" description="تنظیمات پیش‌فرض سایت؛ داده‌های ساختاریافته و نقشه سایت به‌صورت خودکار تولید می‌شوند." />
        <div className="p-5 sm:p-6 space-y-4">
          <div><Label>عنوان سایت</Label><Input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} /></div>
          <div><Label>توضیحات متا پیش‌فرض</Label><Textarea rows={3} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} /></div>
          <ImageUploadField folder="settings" label="تصویر Open Graph پیش‌فرض" value={form.ogImageUrl} onChange={(url) => set("ogImageUrl", url)} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Google Analytics</Label><Input dir="ltr" placeholder="G-XXXXXXXX" value={form.googleAnalyticsId} onChange={(e) => set("googleAnalyticsId", e.target.value)} /></div>
            <div><Label>Google Tag Manager</Label><Input dir="ltr" placeholder="GTM-XXXXXXX" value={form.googleTagManagerId} onChange={(e) => set("googleTagManagerId", e.target.value)} /></div>
          </div>
          <div><Label>Google Search Console Verification</Label><Input dir="ltr" value={form.searchConsoleVerification} onChange={(e) => set("searchConsoleVerification", e.target.value)} placeholder="verification token" /></div>
        </div>
      </Card>
      <Button type="submit" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره تنظیمات"}</Button>
    </form>
  );
}
