import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CartView from '@/src/components/cart/CartView';
import { getCart } from '@/src/lib/cart-data';
import { getCurrentUser } from '@/src/lib/session';
import { canUseRetailCheckout } from '@/src/lib/user-role';

export default function CartPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6" aria-label="breadcrumb">
        <Link href="/" className="hover:text-accent-dark transition-colors">
          خانه
        </Link>
        <span>/</span>
        <span className="text-charcoal font-medium">سبد خرید</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal mb-8">سبد خرید</h1>

      {/* The cart is per-user (reads the session cookie) → request-time data,
          so it streams inside a Suspense boundary while the static shell ships. */}
      <Suspense fallback={<CartSkeleton />}>
        <CartContent />
      </Suspense>
    </div>
  );
}

async function CartContent() {
  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);

  if (user && !canUseRetailCheckout(user.role)) redirect('/dashboard/cart');

  if (cart.items.length === 0) return <EmptyCart />;

  return <CartView initialCart={cart} isAuthenticated={!!user} />;
}

function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-pulse">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-64 bg-white rounded-2xl border border-gray-100" />
        <div className="h-40 bg-white rounded-2xl border border-gray-100" />
      </div>
      <div className="h-64 bg-white rounded-2xl border border-gray-100" />
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <svg className="w-24 h-24 mb-5 text-silver" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
      <h2 className="text-xl font-bold text-charcoal mb-2">سبد خرید شما خالی است</h2>
      <p className="text-sm text-gray-400 mb-8">محصولات مورد نظر خود را از فروشگاه انتخاب کنید.</p>
      <Link
        href="/products"
        className="bg-accent hover:bg-accent-dark text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors shadow hover:shadow-md"
      >
        مشاهده محصولات
      </Link>
    </div>
  );
}
