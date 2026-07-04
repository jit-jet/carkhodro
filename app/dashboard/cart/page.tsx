/**
 * Partner cart / invoice builder — «سبد خرید».
 * Line items with editable quantity, a fuzzy search-&-add modal, an
 * "add from previous purchases" modal, payment terms + notes, and
 * «ثبت فاکتور» which turns the cart into an order. Per-user data streams in.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getPartnerCart, getPreviousPurchaseProducts } from '@/actions/partner-cart';
import { PAYMENT_TERMS } from '@/src/lib/partner-options';
import PartnerCartView from '@/src/components/dashboard/PartnerCartView';

export const metadata: Metadata = {
  title: 'سبد خرید | پنل همکاران کارخودرو',
};

export default function PartnerCartPage() {
  return (
    <Suspense fallback={<CartSkeleton />}>
      <PartnerCartContent />
    </Suspense>
  );
}

async function PartnerCartContent() {
  const [cart, previousPurchases] = await Promise.all([
    getPartnerCart(),
    getPreviousPurchaseProducts(),
  ]);
  return (
    <PartnerCartView
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
