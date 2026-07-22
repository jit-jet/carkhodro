"use client";

/**
 * Create / edit form for redeemable discount codes («کد تخفیف»).
 * Layout mirrors the admin mock: main column (type, code, scope) + side column
 * (usage limits + extra conditions with a «تنظیمات بیشتر» accordion).
 */

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createDiscountCode,
  updateDiscountCode,
  searchProductsForDiscount,
  type DiscountCodeInput,
} from "@/actions/admin-discount-codes";
import type { DiscountScopeType, DiscountType } from "@/generated/prisma_client";
import {
  Button,
  Card,
  FormError,
  FormSuccess,
  Input,
  Label,
  Select,
} from "@/src/components/admin/AdminUI";
import JalaliDateTimeField from "@/src/components/admin/JalaliDateTimeField";
import { useCartUI } from "@/src/store/cart-ui";

export interface DiscountCodeFormInitial {
  id?: string;
  code: string;
  type: DiscountType;
  value: number | null;
  startsAt: string;
  endsAt: string | null;
  scopeType: DiscountScopeType;
  scopeIds: string[];
  scopeLabels: { id: string; label: string }[];
  perCustomerLimit: number | null;
  totalUsageLimit: number | null;
  minCartAmount: number | null;
  maxDiscountAmount: number | null;
  firstOrderOnly: boolean;
  minPreviousOrders: number | null;
  isActive: boolean;
}

type ScopeOption = { id: string; label: string };

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: "PERCENTAGE", label: "درصدی" },
  { value: "FIXED_AMOUNT", label: "مبلغی" },
  { value: "FREE_SHIPPING", label: "ارسال رایگان" },
];

const SCOPE_TYPES: { value: DiscountScopeType; label: string }[] = [
  { value: "CATEGORY", label: "دسته‌بندی" },
  { value: "BRAND", label: "برند قطعه" },
  { value: "CAR_BRAND", label: "برند خودرو" },
  { value: "CAR_MODEL", label: "مدل خودرو" },
  { value: "PRODUCT", label: "محصول" },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SectionIcon({ kind }: { kind: "calendar" | "box" | "sliders" | "conditions" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "w-5 h-5 text-charcoal/70",
  };
  switch (kind) {
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "box":
      return (
        <svg {...common}>
          <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...common}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    case "conditions":
      return (
        <svg {...common}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      );
  }
}

export default function DiscountCodeForm({
  initial,
  categories,
  partsBrands,
  carBrands,
  carModels,
}: {
  initial: DiscountCodeFormInitial;
  categories: { id: number; name: string }[];
  partsBrands: { id: number; name: string }[];
  carBrands: { id: number; name: string }[];
  carModels: { id: number; name: string; brandName: string }[];
}) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const isEditing = Boolean(initial.id);

  const [code, setCode] = useState(initial.code);
  const [type, setType] = useState<DiscountType>(initial.type);
  const [value, setValue] = useState(
    initial.value == null ? "" : String(initial.value),
  );
  const [startsAt, setStartsAt] = useState<string | null>(initial.startsAt || null);
  const [endsAt, setEndsAt] = useState<string | null>(initial.endsAt);
  const [scopeType, setScopeType] = useState<DiscountScopeType>(initial.scopeType);
  const [selected, setSelected] = useState<ScopeOption[]>(initial.scopeLabels);
  const [scopeQuery, setScopeQuery] = useState("");
  const [productHits, setProductHits] = useState<ScopeOption[]>([]);
  const [scopeOpen, setScopeOpen] = useState(false);
  const scopeBoxRef = useRef<HTMLDivElement>(null);

  const [perCustomerLimit, setPerCustomerLimit] = useState(
    initial.perCustomerLimit == null ? "" : String(initial.perCustomerLimit),
  );
  const [totalUsageLimit, setTotalUsageLimit] = useState(
    initial.totalUsageLimit == null ? "" : String(initial.totalUsageLimit),
  );
  const [minCartAmount, setMinCartAmount] = useState(
    initial.minCartAmount == null ? "" : String(initial.minCartAmount),
  );
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(
    initial.maxDiscountAmount == null ? "" : String(initial.maxDiscountAmount),
  );
  const [firstOrderOnly, setFirstOrderOnly] = useState(initial.firstOrderOnly);
  const [minPreviousOrders, setMinPreviousOrders] = useState(
    initial.minPreviousOrders == null ? "" : String(initial.minPreviousOrders),
  );
  const [isActive, setIsActive] = useState(initial.isActive);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();
  const [searching, startSearch] = useTransition();

  const catalogOptions: ScopeOption[] = useMemo(() => {
    if (scopeType === "CATEGORY") {
      return categories.map((c) => ({ id: String(c.id), label: c.name }));
    }
    if (scopeType === "BRAND") {
      return partsBrands.map((b) => ({ id: String(b.id), label: b.name }));
    }
    if (scopeType === "CAR_BRAND") {
      return carBrands.map((b) => ({ id: String(b.id), label: b.name }));
    }
    if (scopeType === "CAR_MODEL") {
      return carModels.map((m) => ({
        id: String(m.id),
        label: `${m.brandName} — ${m.name}`,
      }));
    }
    return productHits;
  }, [scopeType, categories, partsBrands, carBrands, carModels, productHits]);

  const filteredOptions = useMemo(() => {
    const q = scopeQuery.trim().toLowerCase();
    const selectedIds = new Set(selected.map((s) => s.id));
    const base =
      scopeType === "PRODUCT"
        ? catalogOptions
        : catalogOptions.filter((o) => !q || o.label.toLowerCase().includes(q));
    return base.filter((o) => !selectedIds.has(o.id)).slice(0, 30);
  }, [catalogOptions, scopeQuery, selected, scopeType]);

  useEffect(() => {
    if (scopeType !== "PRODUCT") return;
    const q = scopeQuery.trim();
    if (q.length < 1) {
      setProductHits([]);
      return;
    }
    const handle = window.setTimeout(() => {
      startSearch(async () => {
        const hits = await searchProductsForDiscount(q, 12);
        setProductHits(hits);
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [scopeQuery, scopeType]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!scopeBoxRef.current?.contains(e.target as Node)) {
        setScopeOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function switchScopeType(next: DiscountScopeType) {
    setScopeType(next);
    setSelected([]);
    setScopeQuery("");
    setProductHits([]);
    setScopeOpen(false);
  }

  function addScope(option: ScopeOption) {
    setSelected((prev) => (prev.some((p) => p.id === option.id) ? prev : [...prev, option]));
    setScopeQuery("");
    setScopeOpen(false);
  }

  function removeScope(id: string) {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  }

  function buildPayload(): DiscountCodeInput {
    const numOrNull = (raw: string) => {
      const t = raw.trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    };

    return {
      code,
      type,
      value: type === "FREE_SHIPPING" ? null : numOrNull(value),
      startsAt: startsAt ?? "",
      endsAt,
      scopeType,
      scopeIds: selected.map((s) => s.id),
      perCustomerLimit: numOrNull(perCustomerLimit),
      totalUsageLimit: numOrNull(totalUsageLimit),
      minCartAmount: numOrNull(minCartAmount),
      maxDiscountAmount: numOrNull(maxDiscountAmount),
      firstOrderOnly,
      minPreviousOrders: firstOrderOnly ? null : numOrNull(minPreviousOrders),
      isActive,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const payload = buildPayload();

    startTransition(async () => {
      const result = isEditing
        ? await updateDiscountCode(initial.id!, payload)
        : await createDiscountCode(payload);

      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }

      const msg = isEditing ? "کد تخفیف به‌روزرسانی شد." : "کد تخفیف ایجاد شد.";
      setSuccess(msg);
      notify({ variant: "success", title: "ذخیره شد", description: msg });
      router.push("/admin/discount-codes");
      router.refresh();
    });
  }

  const valueLabel =
    type === "PERCENTAGE"
      ? "مقدار تخفیف (به درصد)"
      : type === "FIXED_AMOUNT"
        ? "مقدار تخفیف (تومان)"
        : null;

  const scopeLabel =
    scopeType === "CATEGORY"
      ? "دسته‌بندی‌های مشمول تخفیف"
      : scopeType === "BRAND"
        ? "برندهای قطعه مشمول تخفیف"
        : scopeType === "CAR_BRAND"
          ? "برندهای خودرو مشمول تخفیف"
          : scopeType === "CAR_MODEL"
            ? "مدل‌های خودرو مشمول تخفیف"
            : "محصولات مشمول تخفیف";

  const scopePlaceholder =
    scopeType === "CATEGORY"
      ? "جستجوی دسته‌بندی"
      : scopeType === "BRAND"
        ? "جستجوی برند قطعه"
        : scopeType === "CAR_BRAND"
          ? "جستجوی برند خودرو"
          : scopeType === "CAR_MODEL"
            ? "جستجوی مدل خودرو"
            : "جستجوی محصول";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-5 items-start">
        {/* ── Main column ───────────────────────────────────────────── */}
        <div className="space-y-5 min-w-0">
          <Card className="overflow-hidden">
            <div className="p-5 sm:p-6 space-y-5">
              {/* Type tabs */}
              <div className="grid grid-cols-3 gap-2">
                {DISCOUNT_TYPES.map((t) => {
                  const active = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={[
                        "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-bold transition-colors",
                        active
                          ? "bg-accent/25 border-accent text-charcoal"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-silver-light",
                      ].join(" ")}
                    >
                      {active && <CheckIcon />}
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div>
                <Label>کد تخفیف *</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="مثلاً SUMMER20"
                  dir="ltr"
                  className="text-left tracking-wider font-semibold"
                  required
                />
              </div>

              {valueLabel && (
                <div>
                  <Label>{valueLabel} *</Label>
                  <Input
                    type="number"
                    min={type === "PERCENTAGE" ? 0 : 1}
                    max={type === "PERCENTAGE" ? 100 : undefined}
                    step={type === "PERCENTAGE" ? "0.01" : "1"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === "PERCENTAGE" ? "مثلاً 15" : "مثلاً 50000"}
                    required
                  />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <SectionIcon kind="calendar" />
                  <h3 className="text-base font-bold text-charcoal">دوره اعتبار</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <JalaliDateTimeField
                    label="زمان شروع"
                    value={startsAt}
                    onChange={setStartsAt}
                    required
                  />
                  <JalaliDateTimeField
                    label="زمان پایان"
                    value={endsAt}
                    onChange={setEndsAt}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-visible">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <SectionIcon kind="box" />
                <h3 className="text-base font-bold text-charcoal">محدوده اعمال تخفیف</h3>
              </div>

              <div>
                <Label>اعمال تخفیف بر اساس</Label>
                <Select
                  value={scopeType}
                  onChange={(e) => switchScopeType(e.target.value as DiscountScopeType)}
                >
                  {SCOPE_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>{scopeLabel}</Label>
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selected.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-accent/20 text-charcoal text-xs font-semibold px-2.5 py-1"
                      >
                        {s.label}
                        <button
                          type="button"
                          onClick={() => removeScope(s.id)}
                          className="text-charcoal/60 hover:text-red-600"
                          aria-label="حذف"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative z-30" ref={scopeBoxRef}>
                  <Input
                    value={scopeQuery}
                    onChange={(e) => {
                      setScopeQuery(e.target.value);
                      setScopeOpen(true);
                    }}
                    onFocus={() => setScopeOpen(true)}
                    placeholder={scopePlaceholder}
                  />
                  {scopeOpen && (filteredOptions.length > 0 || searching) && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-72 overflow-y-auto">
                      {searching && scopeType === "PRODUCT" && (
                        <p className="px-3 py-2 text-xs text-gray-400">در حال جستجو…</p>
                      )}
                      {filteredOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => addScope(opt)}
                          className="w-full text-right px-3 py-2.5 text-sm hover:bg-accent/15 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                      {!searching && filteredOptions.length === 0 && scopeQuery && (
                        <p className="px-3 py-2 text-xs text-gray-400">موردی یافت نشد.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-900 leading-relaxed">
                در صورت خالی بودن این بخش، کد تخفیف برای همه محصولات قابل استفاده است.
              </div>
            </div>
          </Card>
        </div>

        {/* ── Side column ───────────────────────────────────────────── */}
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <SectionIcon kind="sliders" />
                <h3 className="text-base font-bold text-charcoal">محدودیت‌های استفاده</h3>
              </div>

              <div>
                <Label>محدودیت استفاده برای هر مشتری</Label>
                <p className="text-xs text-gray-500 mb-1.5">تعداد دفعات استفاده هر مشتری</p>
                <Input
                  type="number"
                  min={1}
                  value={perCustomerLimit}
                  onChange={(e) => setPerCustomerLimit(e.target.value)}
                  placeholder="بدون محدودیت"
                />
              </div>

              <div>
                <Label>محدودیت استفاده از تخفیف</Label>
                <p className="text-xs text-gray-500 mb-1.5">
                  تعداد دفعاتی که این کد قابل استفاده است
                </p>
                <Input
                  type="number"
                  min={1}
                  value={totalUsageLimit}
                  onChange={(e) => setTotalUsageLimit(e.target.value)}
                  placeholder="بدون محدودیت"
                />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <SectionIcon kind="conditions" />
                <h3 className="text-base font-bold text-charcoal">شرایط تکمیلی تخفیف</h3>
              </div>

              <div>
                <Label>حداقل مبلغ سبد خرید برای اعمال کد تخفیف</Label>
                <Input
                  type="number"
                  min={0}
                  value={minCartAmount}
                  onChange={(e) => setMinCartAmount(e.target.value)}
                  placeholder="تومان"
                />
              </div>

              {type === "PERCENTAGE" && (
                <div>
                  <Label>سقف مبلغ تخفیف (تومان)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="بدون سقف"
                  />
                </div>
              )}

              <label className="flex items-center justify-between gap-3 text-sm font-semibold text-charcoal cursor-pointer">
                <span>فقط برای اولین سفارش</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={firstOrderOnly}
                  onClick={() => {
                    const next = !firstOrderOnly;
                    setFirstOrderOnly(next);
                    if (next) setMinPreviousOrders("");
                  }}
                  className={[
                    "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors",
                    firstOrderOnly ? "bg-accent" : "bg-gray-200",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
                      firstOrderOnly ? "left-0.5" : "left-[1.35rem]",
                    ].join(" ")}
                  />
                </button>
              </label>

              {!firstOrderOnly && (
                <div>
                  <Label>حداقل تعداد سفارش موفق قبلی</Label>
                  <Input
                    type="number"
                    min={0}
                    value={minPreviousOrders}
                    onChange={(e) => setMinPreviousOrders(e.target.value)}
                    placeholder="بدون محدودیت"
                  />
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
                کد تخفیف فعال باشد
              </label>
            </div>
          </Card>
        </div>
      </div>

      {error && <FormError message={error} />}
      {success && <FormSuccess message={success} />}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "در حال ذخیره…" : isEditing ? "ذخیره تغییرات" : "ایجاد کد تخفیف"}
        </Button>
        <Link href="/admin/discount-codes">
          <Button type="button" variant="ghost" disabled={pending}>
            بازگشت به لیست
          </Button>
        </Link>
      </div>
    </form>
  );
}
