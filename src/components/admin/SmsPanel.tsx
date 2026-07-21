"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getSmsRecipientCount,
  sendMarketingSms,
  type AdminSmsCampaignVM,
} from "@/actions/admin-sms";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormError,
  FormSuccess,
  Label,
  Select,
  Textarea,
  TableShell,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
} from "@/src/components/admin/AdminUI";
import { formatNumberFa } from "@/src/lib/format";
import type { SmsCampaignStatus, SmsTargetRole } from "@/generated/prisma_client";

const TARGET_OPTIONS: { value: SmsTargetRole; label: string }[] = [
  { value: "ALL", label: "همه کاربران" },
  { value: "WHOLESALE", label: "فقط همکاران (عمده)" },
  { value: "RETAIL", label: "فقط مشتریان تک‌فروش" },
];

/** Persian SMS parts are ~70 chars each (UCS-2 encoding). */
function partCount(len: number): number {
  return len === 0 ? 0 : Math.ceil(len / 70);
}

const STATUS_TONE: Record<SmsCampaignStatus, "success" | "warning" | "danger" | "default"> = {
  SENT: "success",
  PARTIAL: "warning",
  FAILED: "danger",
  PENDING: "default",
};

export default function SmsPanel({ initialHistory }: { initialHistory: AdminSmsCampaignVM[] }) {
  const [targetRole, setTargetRole] = useState<SmsTargetRole>("ALL");
  const [body, setBody] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, startSend] = useTransition();
  const [, startCount] = useTransition();

  useEffect(() => {
    startCount(async () => {
      const count = await getSmsRecipientCount(targetRole);
      setRecipientCount(count);
    });
  }, [targetRole, startCount]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!body.trim()) {
      setError("متن پیامک را وارد کنید.");
      return;
    }
    if (
      !window.confirm(
        `پیامک برای ${(recipientCount ?? 0).toLocaleString("fa-IR")} کاربر ارسال می‌شود. ادامه می‌دهید؟`,
      )
    ) {
      return;
    }

    startSend(async () => {
      const result = await sendMarketingSms({ body, targetRole });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        `پیامک برای ${result.data.successCount.toLocaleString("fa-IR")} از ${result.data.recipientCount.toLocaleString("fa-IR")} کاربر ارسال شد.`,
      );
      setBody("");
      setHistory((prev) => [
        {
          id: result.data.campaignId,
          body,
          targetRole,
          targetRoleLabel: TARGET_OPTIONS.find((t) => t.value === targetRole)?.label ?? targetRole,
          recipientCount: result.data.recipientCount,
          successCount: result.data.successCount,
          failedCount: result.data.recipientCount - result.data.successCount,
          status: result.data.successCount === result.data.recipientCount ? "SENT" : "PARTIAL",
          statusLabel: result.data.successCount === result.data.recipientCount ? "ارسال شد" : "ارسال ناقص",
          createdByName: null,
          createdAtLabel: "همین الان",
        },
        ...prev,
      ]);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title="ارسال پیامک گروهی جدید" description="پیامک به کاربران انتخاب‌شده ارسال می‌شود" />
        <div className="p-5 sm:p-6">
        <form onSubmit={handleSend} className="space-y-4">
          {error && <FormError message={error} />}
          {success && <FormSuccess message={success} />}

          <div>
            <Label>گروه هدف</Label>
            <Select value={targetRole} onChange={(e) => setTargetRole(e.target.value as SmsTargetRole)}>
              {TARGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <p className="text-xs text-gray-500 mt-1.5">
              {recipientCount === null ? "در حال شمارش گیرندگان…" : `${formatNumberFa(recipientCount)} گیرنده با این فیلتر`}
            </p>
          </div>

          <div>
            <Label>متن پیامک</Label>
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={900} required />
            <p className="text-xs text-gray-400 mt-1.5">
              {body.length.toLocaleString("fa-IR")} کاراکتر · {partCount(body.length).toLocaleString("fa-IR")} بخش پیامک
            </p>
          </div>

          <Button type="submit" disabled={sending}>
            {sending ? "در حال ارسال…" : "ارسال پیامک گروهی"}
          </Button>
        </form>
        </div>
      </Card>

      {history.length === 0 ? (
        <Card>
          <CardHeader title="تاریخچه ارسال" />
          <EmptyState message="هنوز پیامکی ارسال نشده است." />
        </Card>
      ) : (
        <div className="space-y-0">
          <Card className="rounded-b-none border-b-0 overflow-hidden">
            <CardHeader title="تاریخچه ارسال" />
          </Card>
          <TableShell className="rounded-t-none">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">متن</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">گروه هدف</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">گیرندگان</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">وضعیت</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">تاریخ</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {history.map((c) => (
                  <tr key={c.id} className={tableRowClass}>
                    <td className="px-4 py-3 max-w-xs truncate text-charcoal">{c.body}</td>
                    <td className="px-4 py-3 text-gray-500">{c.targetRoleLabel}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatNumberFa(c.successCount)} / {formatNumberFa(c.recipientCount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[c.status]}>{c.statusLabel}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{c.createdAtLabel}</td>
                  </tr>
                ))}
              </tbody>
          </TableShell>
        </div>
      )}
    </div>
  );
}
