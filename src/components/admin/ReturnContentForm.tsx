"use client";

import { useState, useTransition } from "react";
import { updateReturnContent } from "@/actions/admin-return-content";
import type { ReturnContentVM } from "@/src/lib/return-defaults";
import { Button, Card, CardHeader, FormError, FormSuccess } from "@/src/components/admin/AdminUI";
import RichTextEditor from "@/src/components/admin/RichTextEditor";
import { useCartUI } from "@/src/store/cart-ui";

export default function ReturnContentForm({ initial }: { initial: ReturnContentVM }) {
  const notify = useCartUI((state) => state.notify);
  const [body, setBody] = useState(initial.body);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setSuccess(false);
    startTransition(async () => {
      const result = await updateReturnContent({ body });
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setSuccess(true);
      notify({ variant: "success", title: "ذخیره موفق", description: "شرایط مرجوعی با موفقیت ذخیره شد." });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}
      {success && <FormSuccess message="شرایط مرجوعی با موفقیت ذخیره شد." />}
      <Card className="overflow-hidden">
        <CardHeader title="متن شرایط مرجوعی" description="محتوای اصلی صفحه شرایط مرجوعی کالا را ویرایش کنید." />
        <div className="p-5 sm:p-6">
          <RichTextEditor value={body} onChange={setBody} placeholder="شرایط و فرآیند مرجوعی کالا را بنویسید…" />
        </div>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره شرایط مرجوعی"}</Button>
      </div>
    </form>
  );
}
