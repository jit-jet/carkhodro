'use client';

/**
 * Product suggestion form — درخواست تأمین کالا.
 * ───────────────────────────────────────────
 * Free-text composer for wholesale partners to request new catalogue items.
 * Shows prior submissions below so the partner can confirm they were recorded.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitProductSuggestion } from '@/actions/product-suggestions';
import type { ProductSuggestionVM } from '@/src/lib/dashboard-types';

export default function ProductSuggestionForm({
  initial,
}: {
  initial: ProductSuggestionVM[];
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDone(false);
    if (!body.trim()) return setError('متن پیشنهاد را وارد کنید.');
    startTransition(async () => {
      const result = await submitProductSuggestion({ body });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody('');
      setDone(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-5"
      >
        <div>
          <h1 className="text-lg font-extrabold text-charcoal mb-1">درخواست تأمین کالا</h1>
          <p className="text-xs text-gray-400">
            نام، مشخصات یا کد قطعه‌ای که مایلید به فروشگاه اضافه شود را بنویسید. پیشنهاد شما برای
            بررسی ثبت می‌شود.
          </p>
        </div>

        {done && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-4 py-3 rounded-xl border border-green-200">
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            پیشنهاد شما با موفقیت ثبت شد.
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="suggestion-body" className="block text-sm font-bold text-charcoal mb-2">
            متن پیشنهاد
          </label>
          <textarea
            id="suggestion-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="مثلاً: فیلتر روغن موتور بوش مناسب پژو ۲۰۶ تیپ ۵…"
            className="w-full border-2 border-silver focus:border-accent rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-y min-h-32"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {pending ? 'در حال ثبت…' : 'ارسال پیشنهاد'}
        </button>
      </form>

      {initial.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
          <h2 className="text-base font-extrabold text-charcoal mb-4">پیشنهادهای قبلی شما</h2>
          <ul className="space-y-3">
            {initial.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-gray-100 bg-silver-light/60 px-4 py-3"
              >
                <p className="text-sm text-charcoal whitespace-pre-wrap leading-relaxed">
                  {item.body}
                </p>
                <p className="text-xs text-gray-400 mt-2">{item.date}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
