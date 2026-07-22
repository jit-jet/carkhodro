"use client";

/**
 * Jalali date + time picker for admin forms.
 * Stores/returns an ISO string (or empty) while editing via Jalali parts.
 */

import { useMemo } from "react";
import {
  JALALI_MONTHS,
  dateToJalaliParts,
  jalaliPartsToDate,
} from "@/src/lib/jalali-convert";
import { Label, Select } from "@/src/components/admin/AdminUI";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoToParts(iso: string | null | undefined): {
  jy: string;
  jm: string;
  jd: string;
  hour: string;
  minute: string;
} {
  if (!iso) {
    return { jy: "", jm: "", jd: "", hour: "00", minute: "00" };
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { jy: "", jm: "", jd: "", hour: "00", minute: "00" };
  }
  const { jy, jm, jd } = dateToJalaliParts(d);
  return {
    jy: String(jy),
    jm: String(jm),
    jd: String(jd),
    hour: pad2(d.getHours()),
    minute: pad2(d.getMinutes()),
  };
}

function partsToIso(parts: {
  jy: string;
  jm: string;
  jd: string;
  hour: string;
  minute: string;
}): string | null {
  const jy = Number(parts.jy);
  const jm = Number(parts.jm);
  const jd = Number(parts.jd);
  if (!jy || !jm || !jd) return null;
  const base = jalaliPartsToDate(jy, jm, jd);
  if (!base) return null;
  const hour = Math.min(23, Math.max(0, Number(parts.hour) || 0));
  const minute = Math.min(59, Math.max(0, Number(parts.minute) || 0));
  const local = new Date(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
    hour,
    minute,
    0,
    0,
  );
  return local.toISOString();
}

const YEARS = Array.from({ length: 12 }, (_, i) => 1400 + i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export default function JalaliDateTimeField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  required?: boolean;
}) {
  const parts = useMemo(() => isoToParts(value), [value]);

  function update(patch: Partial<typeof parts>) {
    const next = { ...parts, ...patch };
    onChange(partsToIso(next));
  }

  const minuteOptions = useMemo(() => {
    const set = new Set(MINUTES);
    const current = Number(parts.minute);
    if (Number.isFinite(current) && !set.has(current)) set.add(current);
    return [...set].sort((a, b) => a - b);
  }, [parts.minute]);

  return (
    <div>
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <div className="rounded-xl border border-gray-200 bg-white p-2.5">
        <div className="grid grid-cols-3 gap-2">
          <Select
            value={parts.jd}
            onChange={(e) => update({ jd: e.target.value })}
            aria-label="روز"
          >
            <option value="">روز</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d.toLocaleString("fa-IR", { useGrouping: false })}
              </option>
            ))}
          </Select>
          <Select
            value={parts.jm}
            onChange={(e) => update({ jm: e.target.value })}
            aria-label="ماه"
          >
            <option value="">ماه</option>
            {JALALI_MONTHS.slice(1).map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            value={parts.jy}
            onChange={(e) => update({ jy: e.target.value })}
            aria-label="سال"
          >
            <option value="">سال</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y.toLocaleString("fa-IR", { useGrouping: false })}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Select
            value={parts.hour}
            onChange={(e) => update({ hour: e.target.value })}
            aria-label="ساعت"
          >
            {HOURS.map((h) => (
              <option key={h} value={pad2(h)}>
                ساعت {pad2(h)}
              </option>
            ))}
          </Select>
          <Select
            value={parts.minute}
            onChange={(e) => update({ minute: e.target.value })}
            aria-label="دقیقه"
          >
            {minuteOptions.map((m) => (
              <option key={m} value={pad2(m)}>
                دقیقه {pad2(m)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {!required && value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1.5 text-xs text-gray-500 hover:text-red-500"
        >
          پاک کردن
        </button>
      )}
    </div>
  );
}
