"use client";

import { useState, useTransition } from "react";
import {
  createShippingOption,
  updateShippingOption,
  deleteShippingOption,
  type ShippingOptionInput,
} from "@/actions/admin-shipping";
import type { AdminShippingOptionVM } from "@/src/lib/serializers";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormError,
  Input,
  Textarea,
} from "@/src/components/admin/AdminUI";
import AdminPagination from "@/src/components/admin/AdminPagination";
import { useClientPagination } from "@/src/hooks/useClientPagination";
import { useCartUI } from "@/src/store/cart-ui";

type ShippingFormState = Omit<ShippingOptionInput, "cost"> & {
  /** Digits-only amount as typed; empty string means no value yet. */
  costDigits: string;
};

const EMPTY_FORM: ShippingFormState = {
  method: "",
  label: "",
  description: "",
  costDigits: "",
  isActive: true,
};

function formatCost(cost: number): string {
  return `${cost.toLocaleString("fa-IR")} تومان`;
}

/** Strip non-digits and leading zeros, then group with "," every 3 digits. */
function formatAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function digitsFromAmount(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

export default function ShippingOptionsManager({
  initialOptions,
}: {
  initialOptions: AdminShippingOptionVM[];
}) {
  const notify = useCartUI((s) => s.notify);
  const [options, setOptions] = useState(initialOptions);
  const [form, setForm] = useState<ShippingFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const pagination = useClientPagination(options, {
    resetKey: String(options.length),
  });

  function reset() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function startEdit(opt: AdminShippingOptionVM) {
    setEditingId(opt.id);
    setForm({
      method: opt.method,
      label: opt.label,
      description: opt.description,
      costDigits: String(opt.cost),
      isActive: opt.isActive,
    });
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.costDigits) {
      setError("هزینه ارسال الزامی است.");
      return;
    }
    const payload: ShippingOptionInput = {
      method: form.method,
      label: form.label,
      description: form.description ?? "",
      cost: Number(form.costDigits),
      isActive: form.isActive ?? true,
    };
    startTransition(async () => {
      if (editingId) {
        const result = await updateShippingOption(editingId, payload);
        if (!result.ok) {
          setError(result.error);
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        setOptions((prev) =>
          [...prev]
            .map((o) =>
              o.id === editingId
                ? {
                    ...o,
                    method: payload.method.trim().toUpperCase().replace(/\s+/g, "_"),
                    label: payload.label.trim(),
                    description: (payload.description ?? "").trim(),
                    cost: payload.cost,
                    isActive: payload.isActive ?? true,
                  }
                : o,
            )
            .sort((a, b) => a.cost - b.cost),
        );
        notify({
          variant: "success",
          title: "ذخیره موفق",
          description: "روش ارسال با موفقیت به‌روزرسانی شد.",
        });
      } else {
        const result = await createShippingOption(payload);
        if (!result.ok) {
          setError(result.error);
          notify({ variant: "error", title: "خطا", description: result.error });
          return;
        }
        setOptions((prev) =>
          [
            ...prev,
            {
              id: result.data.id,
              method: payload.method.trim().toUpperCase().replace(/\s+/g, "_"),
              label: payload.label.trim(),
              description: (payload.description ?? "").trim(),
              cost: payload.cost,
              isActive: payload.isActive ?? true,
            },
          ].sort((a, b) => a.cost - b.cost),
        );
        notify({
          variant: "success",
          title: "ذخیره موفق",
          description: "روش ارسال با موفقیت افزوده شد.",
        });
      }
      reset();
    });
  }

  function handleDelete(id: string) {
    setError("");
    startTransition(async () => {
      const result = await deleteShippingOption(id);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setOptions((prev) => prev.filter((o) => o.id !== id));
      if (editingId === id) reset();
      notify({
        variant: "success",
        title: "حذف موفق",
        description: "روش ارسال با موفقیت حذف شد.",
      });
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title={editingId ? "ویرایش روش ارسال" : "افزودن روش ارسال"} />
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                placeholder="کلید (مثلاً STANDARD)"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                required
                dir="ltr"
                className="text-left"
              />
              <Input
                placeholder="عنوان نمایشی"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
              />
            </div>
            <Textarea
              placeholder="توضیحات (مثلاً ۳ تا ۵ روز کاری)"
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              type="text"
              inputMode="numeric"
              placeholder="مبلغ به تومان"
              value={formatAmountInput(form.costDigits)}
              onChange={(e) =>
                setForm({ ...form, costDigits: digitsFromAmount(e.target.value) })
              }
              required
              dir="ltr"
              className="text-left"
              aria-label="هزینه ارسال به تومان"
            />
            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-accent"
              />
              فعال (نمایش در تسویه‌حساب)
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {editingId ? "ذخیره" : "افزودن"}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={reset}>
                  انصراف
                </Button>
              )}
            </div>
          </form>
          {error && (
            <div className="mt-3">
              <FormError message={error} />
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="لیست روش‌های ارسال"
          description={`${options.length.toLocaleString("fa-IR")} مورد`}
        />
        {options.length === 0 ? (
          <EmptyState message="هنوز روش ارسالی ثبت نشده است." />
        ) : (
          <ul className="divide-y divide-gray-100 px-5 sm:px-6">
            {pagination.items.map((opt) => (
              <li key={opt.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-charcoal">{opt.label}</p>
                      <Badge tone={opt.isActive ? "success" : "warning"}>
                        {opt.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 font-mono" dir="ltr">
                      {opt.method}
                    </p>
                    {opt.description ? (
                      <p className="text-sm text-gray-500 mt-1 leading-6">{opt.description}</p>
                    ) : null}
                    <p className="text-sm font-semibold text-charcoal mt-1">
                      {formatCost(opt.cost)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(opt)}>
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(opt.id)}
                      disabled={pending}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {options.length > 0 && (
        <AdminPagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          total={pagination.total}
          perPage={pagination.perPage}
          onPageChange={pagination.setPage}
          onPerPageChange={pagination.setPerPage}
        />
      )}
    </div>
  );
}
