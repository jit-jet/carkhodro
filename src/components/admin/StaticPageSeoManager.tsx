"use client";

import { useState, useTransition } from "react";
import {
  updateStaticPageSeo,
  type StaticPageSeoVM,
} from "@/actions/admin-static-page-seo";
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

function StaticPageSeoCard({ initial }: { initial: StaticPageSeoVM }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="overflow-hidden">
      <CardHeader title={form.label} description={form.path} />
      <form
        className="p-5 sm:p-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          setSaved(false);
          startTransition(async () => {
            const result = await updateStaticPageSeo(form);
            if (!result.ok) return setError(result.error);
            setSaved(true);
          });
        }}
      >
        {error && <FormError message={error} />}
        {saved && <FormSuccess message="تنظیمات سئوی صفحه ذخیره شد." />}
        <div>
          <Label>عنوان سئو</Label>
          <Input value={form.metaTitle} onChange={(event) => setForm((current) => ({ ...current, metaTitle: event.target.value }))} />
        </div>
        <div>
          <Label>توضیحات متا</Label>
          <Textarea rows={3} value={form.metaDescription} onChange={(event) => setForm((current) => ({ ...current, metaDescription: event.target.value }))} />
        </div>
        <ImageUploadField
          folder="settings"
          label="تصویر Open Graph (اختیاری)"
          value={form.ogImageUrl}
          onChange={(ogImageUrl) => setForm((current) => ({ ...current, ogImageUrl }))}
        />
        <Button type="submit" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره"}</Button>
      </form>
    </Card>
  );
}

export default function StaticPageSeoManager({ initial }: { initial: StaticPageSeoVM[] }) {
  return <div className="grid xl:grid-cols-2 gap-6">{initial.map((page) => <StaticPageSeoCard key={page.path} initial={page} />)}</div>;
}
