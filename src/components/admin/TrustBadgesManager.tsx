"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings } from "@/actions/admin-settings";
import type { FooterTrustBadgeVM } from "@/src/lib/serializers";
import {
  Button,
  Card,
  CardHeader,
  FormError,
  FormSuccess,
  Input,
  Label,
} from "@/src/components/admin/AdminUI";
import { useCartUI } from "@/src/store/cart-ui";

export default function TrustBadgesManager({
  initialBadges,
}: {
  initialBadges: FooterTrustBadgeVM[];
}) {
  const notify = useCartUI((s) => s.notify);
  const [badges, setBadges] = useState(initialBadges);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function setBadge<K extends keyof FooterTrustBadgeVM>(
    index: number,
    key: K,
    value: FooterTrustBadgeVM[K],
  ) {
    setBadges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    startTransition(async () => {
      const result = await updateSiteSettings({ footerTrustBadges: badges });
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setSuccess(true);
      notify({
        variant: "success",
        title: "ذخیره موفق",
        description: "نشان‌های اعتماد با موفقیت ذخیره شد.",
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}
      {success && <FormSuccess message="نشان‌های اعتماد با موفقیت ذخیره شد." />}

      <Card className="overflow-hidden">
        <CardHeader
          title="نشان‌های اعتماد فوتر"
          description="چهار مورد بالای فوتر — آیکون (ایموجی)، عنوان و توضیح کوتاه."
        />
        <div className="p-5 sm:p-6 space-y-5">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="grid sm:grid-cols-[5rem_1fr_1fr] gap-3 rounded-xl border border-gray-100 p-4"
            >
              <div>
                <Label>آیکون</Label>
                <Input
                  value={badge.icon}
                  onChange={(e) => setBadge(index, "icon", e.target.value)}
                  placeholder="🛡️"
                  className="text-center text-xl"
                />
              </div>
              <div>
                <Label>عنوان {index + 1}</Label>
                <Input
                  value={badge.title}
                  onChange={(e) => setBadge(index, "title", e.target.value)}
                  placeholder="عنوان نشان"
                />
              </div>
              <div>
                <Label>توضیح</Label>
                <Input
                  value={badge.desc}
                  onChange={(e) => setBadge(index, "desc", e.target.value)}
                  placeholder="توضیح کوتاه"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? "در حال ذخیره…" : "ذخیره نشان‌ها"}
      </Button>
    </form>
  );
}
