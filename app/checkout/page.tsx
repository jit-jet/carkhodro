import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import CheckoutView from '@/src/components/checkout/CheckoutView';
import { getCart } from '@/src/lib/cart-data';
import { getShippingOptions } from '@/actions/navigation';
import { getCheckoutProfile } from '@/actions/profile';
import { getProvinces } from '@/actions/locations';
import { getCurrentUser } from '@/src/lib/session';

export const metadata: Metadata = {
  title: 'تسویه حساب | کارخودرو',
};

export default function CheckoutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6" aria-label="breadcrumb">
        <Link href="/" className="hover:text-accent-dark transition-colors">
          خانه
        </Link>
        <span>/</span>
        <Link href="/cart" className="hover:text-accent-dark transition-colors">
          سبد خرید
        </Link>
        <span>/</span>
        <span className="text-charcoal font-medium">تسویه حساب</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal mb-8">تسویه حساب</h1>

      {/* Auth + cart are per-request data (read the session cookie) → stream
          inside Suspense while the static shell ships. */}
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}

async function CheckoutContent() {
  // Defense in depth: the `proxy` already bounces signed-out visitors to login,
  // but checkout touches money + saved profile data, so we re-verify here at the
  // data source and send guests to the SMS login, returning them to /checkout.
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/checkout');

  const [cart, shippingOptions, profile, provinces] = await Promise.all([
    getCart(),
    getShippingOptions(),
    getCheckoutProfile(),
    getProvinces(),
  ]);

  // Nothing to check out → bounce back to the cart.
  if (cart.items.length === 0) redirect('/cart');
  // `profile` is non-null because the user is authenticated (guarded above).
  if (!profile) redirect('/login?redirect=/checkout');

  return (
    <CheckoutView cart={cart} shippingOptions={shippingOptions} profile={profile} provinces={provinces} />
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-pulse">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-48 bg-white rounded-2xl border border-gray-100" />
        <div className="h-72 bg-white rounded-2xl border border-gray-100" />
        <div className="h-40 bg-white rounded-2xl border border-gray-100" />
      </div>
      <div className="h-64 bg-white rounded-2xl border border-gray-100" />
    </div>
  );
}
