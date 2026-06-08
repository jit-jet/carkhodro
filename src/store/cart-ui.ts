'use client';

/**
 * Client-side cart UI store (Zustand).
 * ────────────────────────────────────
 * Two cross-component concerns that don't belong to any single page:
 *   • `count`  — the header cart badge. Seeded once from the server via
 *                `getCartCount()` and bumped after every add-to-cart so the
 *                badge updates instantly without a full navigation.
 *   • `toasts` — transient "added to cart" / error notifications, rendered by
 *                the global <Toaster /> mounted in the root layout.
 *
 * The server cart remains the source of truth; this store only mirrors the
 * latest known values for snappy UI feedback.
 */

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface CartUIState {
  count: number;
  toasts: Toast[];
  /** Replace the badge count (e.g. after a server read or cart mutation). */
  setCount: (count: number) => void;
  /** Push a toast; returns its id. Auto-dismissal is handled by <Toaster />. */
  notify: (toast: Omit<Toast, 'id'>) => number;
  dismiss: (id: number) => void;
}

let nextToastId = 1;

export const useCartUI = create<CartUIState>((set) => ({
  count: 0,
  toasts: [],
  setCount: (count) => set({ count: Math.max(0, count) }),
  notify: (toast) => {
    const id = nextToastId++;
    set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience: announce a product was added and refresh the badge count. */
export function announceAddedToCart(name: string, quantity: number, count: number): void {
  const { notify, setCount } = useCartUI.getState();
  setCount(count);
  notify({
    variant: 'success',
    title: 'به سبد خرید اضافه شد',
    description: `${name} — ${quantity.toLocaleString('fa-IR')} عدد`,
  });
}
