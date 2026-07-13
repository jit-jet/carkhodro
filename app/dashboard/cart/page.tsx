/**
 * Cart / invoice builder — «سبد خرید».
 * Line items with editable quantity, a fuzzy search-&-add modal, an
 * "add from previous purchases" modal, payment terms + notes, and
 * «ثبت فاکتور» which turns the cart into an order. Per-user data streams in.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getDashboardCart, getPreviousPurchaseProducts } from '@/actions/dashboard-cart';
import { PAYMENT_TERMS } from '@/src/lib/dashboard-options';
import CartView from '@/src/components/dashboard/CartView';
import { getCurrentUser } from '@/src/lib/session';
import { canUseDashboardCart } from '@/src/lib/user-role';

export const metadata: Metadata = {
  title: 'سبد خرید | پنل کاربری کارخودرو',
};

export default function CartPage() {
  return (
    <Suspense fallback={<CartSkeleton />}>
      <CartContent />
    </Suspense>
  );
}

async function CartContent() {
  const user = await getCurrentUser();
  if (!user || !canUseDashboardCart(user.role)) redirect('/cart');

  const [cart, previousPurchases] = await Promise.all([
    getDashboardCart(),
    getPreviousPurchaseProducts(),
  ]);
  return (
    <CartView
      initialCart={cart}
      previousPurchases={previousPurchases}
      paymentTerms={[...PAYMENT_TERMS]}
    />
  );
}

function CartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-96 animate-pulse" />
  );
}
