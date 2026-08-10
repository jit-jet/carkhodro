"use client";

import { useState, useTransition } from "react";
import {
  deleteSeoRedirect,
  saveSeoRedirect,
  type SeoRedirectVM,
} from "@/actions/admin-seo";
import {
  Button,
  Card,
  CardHeader,
  FormError,
  Input,
  Select,
} from "@/src/components/admin/AdminUI";

export default function RedirectManager({ initial }: { initial: SeoRedirectVM[] }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<number>();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [statusCode, setStatusCode] = useState<301 | 302>(301);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setEditing(undefined);
    setSource("");
    setDestination("");
    setStatusCode(301);
    setError("");
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="ریدایرکت‌های ۳۰۱ و ۳۰۲"
        description="۳۰۱ برای انتقال دائمی و ۳۰۲ برای انتقال موقت استفاده می‌شود."
      />
      <div className="p-5 sm:p-6 space-y-5">
        {error && <FormError message={error} />}
        <form
          className="grid sm:grid-cols-[1fr_1fr_9rem_auto] gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await saveSeoRedirect({
                id: editing,
                source,
                destination,
                statusCode,
              });
              if (!result.ok) return setError(result.error);
              setRows((current) =>
                editing
                  ? current.map((row) => (row.id === editing ? result.data : row))
                  : [...current, result.data],
              );
              reset();
            });
          }}
        >
          <Input dir="ltr" placeholder="/old-path" value={source} onChange={(event) => setSource(event.target.value)} required />
          <Input dir="ltr" placeholder="/new-path" value={destination} onChange={(event) => setDestination(event.target.value)} required />
          <Select value={statusCode} onChange={(event) => setStatusCode(Number(event.target.value) as 301 | 302)} aria-label="نوع ریدایرکت">
            <option value={301}>301 دائمی</option>
            <option value={302}>302 موقت</option>
          </Select>
          <Button disabled={pending}>{editing ? "ذخیره" : "ایجاد"}</Button>
        </form>

        <div className="divide-y divide-gray-100">
          {rows.map((row) => (
            <div key={row.id} className="py-3 flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold" dir="ltr">{row.statusCode}</span>
              <code dir="ltr" className="flex-1 text-sm">{row.source} → {row.destination}</code>
              <Button variant="ghost" onClick={() => {
                setEditing(row.id);
                setSource(row.source);
                setDestination(row.destination);
                setStatusCode(row.statusCode === 302 ? 302 : 301);
              }}>ویرایش</Button>
              <Button variant="danger" onClick={() => startTransition(async () => {
                const result = await deleteSeoRedirect(row.id);
                if (result.ok) setRows((current) => current.filter((item) => item.id !== row.id));
              })}>حذف</Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
