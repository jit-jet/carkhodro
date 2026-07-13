'use client';

/**
 * Re-sync client UI mirrors (cart badge + wishlist/compare sets) with the
 * server after auth transitions (login, logout, signup) or navigation.
 */

import { getCartCount } from '@/actions/cart';
import { getListItemIds } from '@/actions/lists';
import { useCartUI } from '@/src/store/cart-ui';
import { useListsUI } from '@/src/store/lists-ui';

/** Fetch authoritative cart + list membership and update client stores. */
export async function refreshClientUI(): Promise<void> {
  const [count, lists] = await Promise.all([getCartCount(), getListItemIds()]);
  useCartUI.getState().setCount(count);
  useListsUI.getState().hydrate(lists.wishlist, lists.compare);
}
