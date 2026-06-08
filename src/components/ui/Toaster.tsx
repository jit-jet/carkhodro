'use client';

/**
 * Global toast viewport.
 * ──────────────────────
 * Mounted once in the root layout. Renders the toast queue from `useCartUI`
 * and auto-dismisses each toast after a few seconds. Fixed to the top-center so
 * it works the same on every page; respects RTL via the surrounding `dir`.
 */

import { useEffect } from 'react';
import { useCartUI, type Toast } from '@/src/store/cart-ui';

const AUTO_DISMISS_MS = 3500;

export default function Toaster() {
  const toasts = useCartUI((s) => s.toasts);

  return (
    <div
      className="fixed top-4 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="اعلان‌ها"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useCartUI((s) => s.dismiss);

  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [toast.id, dismiss]);

  const isError = toast.variant === 'error';

  return (
    <div
      className={[
        'pointer-events-auto w-full max-w-sm rounded-2xl shadow-lg border px-4 py-3',
        'flex items-start gap-3 animate-[fadeIn_0.2s_ease-out] bg-white',
        isError ? 'border-red-200' : 'border-green-200',
      ].join(' ')}
      role="status"
    >
      <span
        className={[
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          isError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600',
        ].join(' ')}
      >
        {isError ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-charcoal">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-5">{toast.description}</p>
        )}
      </div>

      <button
        onClick={() => dismiss(toast.id)}
        className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
        aria-label="بستن"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
