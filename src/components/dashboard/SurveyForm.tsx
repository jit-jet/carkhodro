'use client';

/**
 * Order survey form.
 * ──────────────────
 * Star rating + positive/negative checkbox groups (fixed option lists) + a
 * free-text note. Pre-filled from any previously submitted survey so the partner
 * can revise it. Submits via `submitSurvey`, which upserts one survey per order.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitSurvey } from '@/actions/surveys';
import { POSITIVE_POINTS, NEGATIVE_POINTS } from '@/src/lib/survey-options';
import { formatNumberFa } from '@/src/lib/format';
import type { SurveyVM } from '@/src/lib/dashboard-types';

export default function SurveyForm({ survey }: { survey: SurveyVM }) {
  const router = useRouter();
  const [rating, setRating] = useState(survey.rating);
  const [hovered, setHovered] = useState(0);
  const [positive, setPositive] = useState<Set<string>>(new Set(survey.positivePoints));
  const [negative, setNegative] = useState<Set<string>>(new Set(survey.negativePoints));
  const [note, setNote] = useState(survey.note ?? '');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, key: string) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (rating < 1) return setError('لطفاً یک ستاره را انتخاب کنید.');
    startTransition(async () => {
      const result = await submitSurvey({
        orderId: survey.orderId,
        rating,
        positivePoints: [...positive],
        negativePoints: [...negative],
        note,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  const display = hovered || rating;

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-7">
      <div>
        <h1 className="text-lg font-extrabold text-charcoal">
          نظرسنجی برای فاکتور {formatNumberFa(survey.orderNumber)}
        </h1>
        {survey.submittedAt && (
          <p className="text-xs text-gray-400 mt-1">آخرین ثبت: {survey.submittedAt}</p>
        )}
      </div>

      {done && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-4 py-3 rounded-xl border border-green-200">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          نظر شما با موفقیت ثبت شد.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Stars */}
      <div>
        <h2 className="text-base font-bold text-accent-dark mb-1">ثبت ستاره</h2>
        <p className="text-xs text-gray-400 mb-2">یک ستاره را انتخاب کنید</p>
        <span className="flex items-center gap-1.5" dir="ltr">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`امتیاز ${i}`}
            >
              <svg width="32" height="32" viewBox="0 0 24 24">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={i <= display ? '#F4C232' : '#E5E7EB'}
                  stroke={i <= display ? '#D89B1F' : '#D1D5DB'}
                  strokeWidth="0.5"
                  className="transition-colors"
                />
              </svg>
            </button>
          ))}
        </span>
      </div>

      {/* Positive */}
      <PointGroup
        title="نکات مثبت"
        titleClass="text-emerald-600"
        options={POSITIVE_POINTS}
        selected={positive}
        onToggle={(k) => toggle(positive, setPositive, k)}
      />

      {/* Negative */}
      <PointGroup
        title="نکات منفی"
        titleClass="text-red-500"
        options={NEGATIVE_POINTS}
        selected={negative}
        onToggle={(k) => toggle(negative, setNegative, k)}
      />

      {/* Note */}
      <div>
        <h2 className="text-base font-bold text-charcoal mb-2">نکات دیگر</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="نوشتن نظر…"
          className="w-full border-2 border-silver focus:border-accent rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none leading-7"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm px-8 py-3 rounded-xl transition-colors disabled:opacity-60"
      >
        {pending ? 'در حال ثبت…' : 'ارسال نظر'}
      </button>
    </form>
  );
}

function PointGroup({
  title,
  titleClass,
  options,
  selected,
  onToggle,
}: {
  title: string;
  titleClass: string;
  options: { key: string; label: string }[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div>
      <h2 className={`text-base font-bold mb-3 ${titleClass}`}>{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {options.map((o) => {
          const checked = selected.has(o.key);
          return (
            <label
              key={o.key}
              className={[
                'flex items-start gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm',
                checked ? 'border-accent bg-amber-50' : 'border-gray-200 hover:bg-silver-light',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.key)}
                className="mt-0.5 w-4 h-4 accent-accent-dark shrink-0"
              />
              <span className="text-charcoal leading-6">{o.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
