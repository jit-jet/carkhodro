'use client';

/**
 * Add / remove a product to the user's wishlist. Reusable across the PDP
 * (`variant="full"`, a labelled pill) and product cards (`variant="icon"`, a
 * circular heart overlay). Active state comes from the shared lists store
 * (hydrated once per page), updates optimistically, and rolls back on failure.
 */

import { useEffect, useTransition } from 'react';
import { addToWishlist, removeFromWishlist } from '@/actions/lists';
import { useListsUI, ensureListsHydrated } from '@/src/store/lists-ui';
import { useCartUI } from '@/src/store/cart-ui';

interface Props {
  productId: string;
  productName: string;
  /** icon = circular overlay · full = labelled pill (PDP) · compact = small card-body row button */
  variant?: 'icon' | 'full' | 'compact';
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-5 h-5 shrink-0"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
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

export default function WishlistButton({ productId, productName, variant = 'icon' }: Props) {
  const active = useListsUI((s) => s.wishlist.has(productId));
  const setWishlist = useListsUI((s) => s.setWishlist);
  const notify = useCartUI((s) => s.notify);
  const [pending, startTransition] = useTransition();

  useEffect(() => ensureListsHydrated(), []);

  function toggle() {
    const next = !active;
    setWishlist(productId, next); // optimistic
    startTransition(async () => {
      const res = next ? await addToWishlist(productId) : await removeFromWishlist(productId);
      if (res.ok) {
        notify({
          variant: 'success',
          title: next ? 'به علاقه‌مندی‌ها افزوده شد' : 'از علاقه‌مندی‌ها حذف شد',
          description: productName,
        });
      } else {
        setWishlist(productId, !next); // rollback
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
        aria-label={active ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        title={active ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        className={[
          'flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-sm shadow-sm transition-all duration-150 active:scale-90 disabled:opacity-60',
          active
            ? 'bg-red-500 text-white'
            : 'bg-white/90 text-gray-500 hover:text-red-500 hover:bg-white',
        ].join(' ')}
      >
        {pending ? <Spinner /> : <HeartIcon filled={active} />}
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
        aria-label={active ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        className={[
          'flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-2 rounded-xl border transition-all duration-150 active:scale-95 disabled:opacity-60',
          active
            ? 'border-red-400 bg-red-50 text-red-600'
            : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50/60',
        ].join(' ')}
      >
        {pending ? <Spinner /> : <HeartIcon filled={active} />}
        <span>علاقه‌مندی</span>
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
          ? 'border-red-500 bg-red-50 text-red-600'
          : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500',
      ].join(' ')}
    >
      {pending ? <Spinner /> : <HeartIcon filled={active} />}
      {active ? 'در علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
    </button>
  );
}
