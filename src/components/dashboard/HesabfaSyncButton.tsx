'use client';

/**
 * Manual Hesabfa sync controls (admin dashboard).
 * ───────────────────────────────────────────────
 * Two buttons backed by the admin Server Actions:
 *   • "همگام‌سازی با حسابفا" → full force-sync; shows created/updated/deactivated.
 *   • "ثبت وب‌هوک"           → (re)register the change-hook endpoint.
 * `useTransition` keeps the UI responsive and disables the buttons while a
 * request is in flight.
 */

import { useState, useTransition } from 'react';
import { forceSyncHesabfa, registerHesabfaWebhook } from '@/actions/hesabfa';

type Feedback = { ok: boolean; message: string } | null;

function fa(n: number): string {
  return n.toLocaleString('fa-IR');
}

export default function HesabfaSyncButton() {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);

  function runSync() {
    setFeedback(null);
    startTransition(async () => {
      const res = await forceSyncHesabfa();
      if (res.ok) {
        const { created, updated, deactivated, total } = res.data;
        setFeedback({
          ok: true,
          message: `همگام‌سازی کامل شد: ${fa(total)} کالا بررسی شد — ${fa(created)} جدید، ${fa(updated)} به‌روزرسانی، ${fa(deactivated)} غیرفعال.`,
        });
      } else {
        setFeedback({ ok: false, message: res.error });
      }
    });
  }

  function registerHook() {
    setFeedback(null);
    startTransition(async () => {
      const res = await registerHesabfaWebhook();
      setFeedback(
        res.ok
          ? { ok: true, message: `وب‌هوک ثبت شد: ${res.data.url}` }
          : { ok: false, message: res.error },
      );
    });
  }

  return (
    <div className="w-full bg-white border-2 border-silver-light rounded-2xl px-5 py-5 text-right">
      <h3 className="text-base font-bold text-charcoal mb-1">همگام‌سازی حسابفا</h3>
      <p className="text-xs text-gray-500 leading-6 mb-4">
        دریافت قیمت و موجودی محصولات از سیستم حسابداری حسابفا. به‌روزرسانی‌های
        لحظه‌ای از طریق وب‌هوک انجام می‌شود؛ این دکمه برای همگام‌سازی کامل دستی است.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runSync}
          disabled={pending}
          className="bg-accent hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors"
        >
          {pending ? 'در حال همگام‌سازی…' : 'همگام‌سازی با حسابفا'}
        </button>

        <button
          type="button"
          onClick={registerHook}
          disabled={pending}
          className="bg-white border-2 border-silver-light hover:border-accent disabled:opacity-60 disabled:cursor-not-allowed text-charcoal text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors"
        >
          ثبت وب‌هوک
        </button>
      </div>

      {feedback && (
        <p
          className={`mt-4 text-xs leading-6 rounded-xl px-4 py-3 ${
            feedback.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
