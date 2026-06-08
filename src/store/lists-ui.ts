'use client';

/**
 * Client store for wishlist / compare membership (Zustand).
 * ─────────────────────────────────────────────────────────
 * Holds just the set of product ids in each list so any wishlist/compare button
 * — on the PDP or on a grid of product cards — can render its active state in
 * O(1) without its own server round-trip. The product cards/PDP themselves stay
 * cached/static; this per-user layer is added on the client.
 *
 * The sets are seeded once via `ensureListsHydrated()` (single-flight, so a page
 * full of cards triggers exactly one `getListItemIds` request). The server tables
 * remain the source of truth; this store mirrors them for snappy, optimistic UI.
 */

import { create } from 'zustand';
import { getListItemIds } from '@/actions/lists';

interface ListsUIState {
  wishlist: Set<string>;
  compare: Set<string>;
  hydrated: boolean;
  hydrate: (wishlist: string[], compare: string[]) => void;
  setWishlist: (productId: string, on: boolean) => void;
  setCompare: (productId: string, on: boolean) => void;
}

export const useListsUI = create<ListsUIState>((set) => ({
  wishlist: new Set(),
  compare: new Set(),
  hydrated: false,
  hydrate: (wishlist, compare) =>
    set({ wishlist: new Set(wishlist), compare: new Set(compare), hydrated: true }),
  setWishlist: (productId, on) =>
    set((state) => {
      const next = new Set(state.wishlist);
      if (on) next.add(productId);
      else next.delete(productId);
      return { wishlist: next };
    }),
  setCompare: (productId, on) =>
    set((state) => {
      const next = new Set(state.compare);
      if (on) next.add(productId);
      else next.delete(productId);
      return { compare: next };
    }),
}));

// ── Single-flight hydration ──────────────────────────────────────────────────

let hydrationPromise: Promise<void> | null = null;

/**
 * Seed the store from the server once per page load. Safe to call from every
 * button's mount effect — concurrent callers share one in-flight request, and
 * once hydrated it's a no-op. On failure it clears the guard so a later mount
 * can retry.
 */
export function ensureListsHydrated(): void {
  if (hydrationPromise || useListsUI.getState().hydrated) return;
  hydrationPromise = getListItemIds()
    .then(({ wishlist, compare }) => {
      useListsUI.getState().hydrate(wishlist, compare);
    })
    .catch(() => {
      hydrationPromise = null;
    });
}
