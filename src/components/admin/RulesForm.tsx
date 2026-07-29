"use client";

import { useState, useTransition } from "react";
import { updateRulesContent } from "@/actions/admin-rules";
import type { RulesContentVM } from "@/src/lib/rules-defaults";
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
import RichTextEditor from "@/src/components/admin/RichTextEditor";
import { useCartUI } from "@/src/store/cart-ui";

export default function RulesForm({ initial }: { initial: RulesContentVM }) {
  const notify = useCartUI((s) => s.notify);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof RulesContentVM>(key: K, value: RulesContentVM[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    startTransition(async () => {
      const result = await updateRulesContent(form);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setSuccess(true);
      notify({
        variant: "success",
        title: "ذخیره موفق",
        description: "قوانین و مقررات با موفقیت ذخیره شد.",
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}
      {success && <FormSuccess message="قوانین و مقررات با موفقیت ذخیره شد." />}

      <Card className="overflow-hidden">
        <CardHeader
          title="اطلاعات صفحه"
          description="عنوان ثابت است؛ تاریخ به‌روزرسانی و متن معرفی را اینجا ویرایش کنید."
        />
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <Label>متن زیر به‌روزرسانی</Label>
            <Input
              value={form.updatedLabel}
              onChange={(e) => set("updatedLabel", e.target.value)}
              placeholder="آخرین به‌روزرسانی: …"
            />
          </div>
          <div>
            <Label>متن معرفی (باکس زرد)</Label>
            <Textarea
              value={form.intro}
              onChange={(e) => set("intro", e.target.value)}
              rows={4}
              placeholder="متن کوتاه معرفی قوانین…"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="متن قوانین"
          description="بدنه اصلی صفحه قوانین و مقررات — از قالب‌بندی تیتر و پاراگراف استفاده کنید."
        />
        <div className="p-5 sm:p-6">
          <RichTextEditor
            value={form.body}
            onChange={(html) => set("body", html)}
            placeholder="متن قوانین و مقررات را بنویسید…"
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "در حال ذخیره…" : "ذخیره قوانین"}
        </Button>
      </div>
    </form>
  );
}
