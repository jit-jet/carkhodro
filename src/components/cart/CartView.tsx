'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import CartItemRow from '@/src/components/cart/CartItemRow';
import OrderSummary from '@/src/components/cart/OrderSummary';
import { updateCartItemQuantity, removeCartItem, validateCartStockForCheckout } from '@/actions/cart';
import type { CartVM, CartItemVM } from '@/src/lib/serializers';
import { useCartUI, notifyStockLimit } from '@/src/store/cart-ui';

interface Props {
  initialCart: CartVM;
  /** False for guests — proceeding to checkout sends them to login first. */
  isAuthenticated: boolean;
}

/**
 * The cart is now review-only: edit quantities / remove items here, then proceed
 * to /checkout where shipping, payment and delivery details are collected. The
 * checkout route is auth-gated, so guests are routed through the SMS login and
 * returned to /checkout afterwards.
 */
export default function CartView({ initialCart, isAuthenticated }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<CartItemVM[]>(initialCart.items);
  const [pending, startTransition] = useTransition();
  const [checkingOut, startCheckout] = useTransition();
  const [error, setError] = useState('');
  const setCount = useCartUI((s) => s.setCount);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  function updateQty(id: string, delta: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const requested = item.quantity + delta;
    if (delta > 0 && requested > item.stock) {
      notifyStockLimit(item.stock);
      return;
    }
    const nextQty = Math.max(1, Math.min(item.stock, requested));
    if (nextQty === item.quantity) return;

    // Optimistic update, reconciled with the server's authoritative cart.
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: nextQty } : i)));
    startTransition(async () => {
      const result = await updateCartItemQuantity(id, nextQty);
      if (result.ok) {
        setItems(result.data.items);
        setCount(result.data.totalItems);
        if (result.data.stockCapped && result.data.maxStock != null) {
          notifyStockLimit(result.data.maxStock);
        }
      } else setError(result.error);
    });
  }

  function removeItem(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      const result = await removeCartItem(id);
      if (result.ok) {
        setItems(result.data.items);
        setCount(result.data.totalItems);
      } else {
        setItems(snapshot);
        setError(result.error);
      }
    });
  }

  function proceedToCheckout() {
    setError('');
    startCheckout(async () => {
      const result = await validateCartStockForCheckout();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(isAuthenticated ? '/checkout' : '/login?redirect=/checkout');
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 whitespace-pre-line">
            {error}
          </div>
        )}

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-dark shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            <h2 className="font-semibold text-charcoal">
              محصولات ({items.length.toLocaleString('fa-IR')})
            </h2>
          </div>

          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={updateQty}
                onRemove={removeItem}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <OrderSummary
            subtotal={subtotal}
            shippingCost={null}
            total={subtotal}
            itemCount={totalItems}
            ctaLabel="ادامه و تسویه حساب"
            onPlaceOrder={proceedToCheckout}
            busy={pending || checkingOut}
          />
          {!isAuthenticated && (
            <p className="text-center text-xs text-gray-400 mt-3 leading-5">
              برای تکمیل خرید ابتدا وارد می‌شوید؛ سبد خرید شما حفظ می‌شود.
            </p>
          )}
          {(pending || checkingOut) && (
            <p className="text-center text-xs text-gray-400 mt-3">
              {checkingOut ? 'در حال بررسی موجودی…' : 'در حال به‌روزرسانی…'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
