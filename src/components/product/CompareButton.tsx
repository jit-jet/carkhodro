'use client';

/**
 * Add / remove a product to the user's compare list. Same dual-variant shape as
 * <WishlistButton> (icon overlay on cards, labelled pill on the PDP). The active
 * compare list is capped at COMPARE_LIMIT; when the cap is reached the button
 * surfaces a friendly error instead of calling the server (the action enforces
 * the same limit authoritatively).
 */

import { useEffect, useTransition } from 'react';
import { addToCompare, removeFromCompare } from '@/actions/lists';
import { useListsUI, ensureListsHydrated } from '@/src/store/lists-ui';
import { useCartUI } from '@/src/store/cart-ui';
import { COMPARE_LIMIT } from '@/src/lib/lists';

interface Props {
  productId: string;
  productName: string;
  /** icon = circular overlay · full = labelled pill (PDP) · compact = small card-body row button */
  variant?: 'icon' | 'full' | 'compact';
}

function CompareIcon() {
  return (
    <svg
      className="w-5 h-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3v18M15 3v18" />
      <path d="M9 7l-4 4 4 4M15 7l4 4-4 4" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export default function CompareButton({ productId, productName, variant = 'icon' }: Props) {
  const active = useListsUI((s) => s.compare.has(productId));
  const compareSize = useListsUI((s) => s.compare.size);
  const hydrated = useListsUI((s) => s.hydrated);
  const setCompare = useListsUI((s) => s.setCompare);
  const notify = useCartUI((s) => s.notify);
  const [pending, startTransition] = useTransition();

  useEffect(() => ensureListsHydrated(), []);

  function toggle() {
    const next = !active;

    // Instant client-side guard once the list is known — avoids a doomed request.
    if (next && hydrated && compareSize >= COMPARE_LIMIT) {
      notify({
        variant: 'error',
        title: 'لیست مقایسه پر است',
        description: `حداکثر ${COMPARE_LIMIT.toLocaleString('fa-IR')} محصول قابل مقایسه است.`,
      });
      return;
    }

    setCompare(productId, next); // optimistic
    startTransition(async () => {
      const res = next ? await addToCompare(productId) : await removeFromCompare(productId);
      if (res.ok) {
        notify({
          variant: 'success',
          title: next ? 'به لیست مقایسه افزوده شد' : 'از لیست مقایسه حذف شد',
          description: productName,
        });
      } else {
        setCompare(productId, !next); // rollback
        notify({ variant: 'error', title: 'خطا', description: res.error });
      }
    });
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={active}
        aria-label={active ? 'حذف از لیست مقایسه' : 'افزودن به لیست مقایسه'}
        title={active ? 'حذف از لیست مقایسه' : 'افزودن به لیست مقایسه'}
        className={[
          'flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-sm shadow-sm transition-all duration-150 active:scale-90 disabled:opacity-60',
          active
            ? 'bg-blue-600 text-white'
            : 'bg-white/90 text-gray-500 hover:text-blue-600 hover:bg-white',
        ].join(' ')}
      >
        {pending ? <Spinner /> : <CompareIcon />}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={active}
        aria-label={active ? 'حذف از لیست مقایسه' : 'افزودن به لیست مقایسه'}
        className={[
          'flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-2 rounded-xl border transition-all duration-150 active:scale-95 disabled:opacity-60',
          active
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/60',
        ].join(' ')}
      >
        {pending ? <Spinner /> : <CompareIcon />}
        <span>مقایسه</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={active}
      className={[
        'flex-1 flex items-center justify-center gap-2 font-semibold text-sm py-2.5 rounded-xl border-2 transition-all duration-150 active:scale-95 disabled:opacity-60',
        active
          ? 'border-blue-600 bg-blue-50 text-blue-700'
          : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600',
      ].join(' ')}
    >
      {pending ? <Spinner /> : <CompareIcon />}
      {active ? 'در لیست مقایسه' : 'افزودن به مقایسه'}
    </button>
  );
}
