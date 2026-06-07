'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import CartItemRow from '@/src/components/cart/CartItemRow';
import ShippingSelector from '@/src/components/cart/ShippingSelector';
import PaymentSelector from '@/src/components/cart/PaymentSelector';
import OrderSummary from '@/src/components/cart/OrderSummary';
import {
  updateCartItemQuantity,
  removeCartItem,
} from '@/actions/cart';
import { createOrder } from '@/actions/orders';
import type { CartVM, CartItemVM, ShippingOptionVM } from '@/src/lib/serializers';
import type { PaymentMethod } from '@/src/data/cartMockData';

interface Props {
  initialCart: CartVM;
  shippingOptions: ShippingOptionVM[];
}

export default function CartView({ initialCart, shippingOptions }: Props) {
  const [items, setItems] = useState<CartItemVM[]>(initialCart.items);
  const [shippingId, setShippingId] = useState(shippingOptions[0]?.id ?? '');
  const [payment, setPayment] = useState<PaymentMethod>('online');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = shippingOptions.find((s) => s.id === shippingId)?.cost ?? 0;
  const total = subtotal + shippingCost;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  function updateQty(id: string, delta: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const nextQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
    if (nextQty === item.quantity) return;

    // Optimistic update, reconciled with the server's authoritative cart.
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: nextQty } : i)));
    startTransition(async () => {
      const result = await updateCartItemQuantity(id, nextQty);
      if (result.ok) setItems(result.data.items);
      else setError(result.error);
    });
  }

  function removeItem(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      const result = await removeCartItem(id);
      if (result.ok) setItems(result.data.items);
      else {
        setItems(snapshot);
        setError(result.error);
      }
    });
  }

  function placeOrder() {
    setError('');
    startTransition(async () => {
      const result = await createOrder({
        shippingOptionId: shippingId,
        paymentMethod: payment === 'online' ? 'ONLINE' : 'COD',
      });
      if (result.ok) {
        setPlaced(true);
        setItems([]);
      } else {
        setError(result.error);
      }
    });
  }

  if (placed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-5">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-charcoal mb-2">سفارش شما با موفقیت ثبت شد</h2>
        <p className="text-sm text-gray-400 mb-8">به زودی با شما تماس می‌گیریم. 🎉</p>
        <Link
          href="/products"
          className="bg-accent hover:bg-accent-dark text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors shadow hover:shadow-md"
        >
          ادامه خرید
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
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

        <ShippingSelector
          options={shippingOptions}
          selected={shippingId}
          onChange={setShippingId}
        />

        <PaymentSelector selected={payment} onChange={setPayment} />
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <OrderSummary
            subtotal={subtotal}
            shippingCost={shippingCost}
            total={total}
            itemCount={totalItems}
            onPlaceOrder={placeOrder}
          />
          {pending && (
            <p className="text-center text-xs text-gray-400 mt-3">در حال به‌روزرسانی…</p>
          )}
        </div>
      </div>
    </div>
  );
}
