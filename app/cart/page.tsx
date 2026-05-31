'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  initialCartItems,
  shippingOptions,
  type CartItem,
  type PaymentMethod,
} from '@/src/data/cartMockData';
import CartItemRow from '@/src/components/cart/CartItemRow';
import ShippingSelector from '@/src/components/cart/ShippingSelector';
import PaymentSelector from '@/src/components/cart/PaymentSelector';
import OrderSummary from '@/src/components/cart/OrderSummary';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(initialCartItems);
  const [shippingId, setShippingId] = useState(shippingOptions[0].id);
  const [payment, setPayment] = useState<PaymentMethod>('online');

  /* ── Derived values ─────────────────────────────────── */
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = shippingOptions.find((s) => s.id === shippingId)?.cost ?? 0;
  const total = subtotal + shippingCost;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  /* ── Handlers ───────────────────────────────────────── */
  function updateQty(id: number, delta: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function placeOrder() {
    const payload = {
      cartItems: items.map(({ id, name, sku, price, quantity }) => ({
        id,
        name,
        sku,
        price,
        quantity,
        lineTotal: price * quantity,
      })),
      shippingMethod: shippingOptions.find((s) => s.id === shippingId),
      paymentMethod: payment,
      subtotal,
      shippingCost,
      total,
    };

    console.log('📦 Order Payload:', payload);
    alert('سفارش شما با موفقیت ثبت شد!\nبه زودی با شما تماس می‌گیریم. 🎉');
  }

  /* ── Render ─────────────────────────────────────────── */
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

      {/* Page heading */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal mb-8">
        سبد خرید
        {items.length > 0 && (
          <span className="text-base font-normal text-gray-400 ms-2">
            ({totalItems.toLocaleString('fa-IR')} کالا)
          </span>
        )}
      </h1>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        /* Two-column on lg+: main (2/3) + sticky sidebar (1/3) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ── Main column ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Cart items card */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-accent-dark shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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

            {/* Shipping */}
            <ShippingSelector
              options={shippingOptions}
              selected={shippingId}
              onChange={setShippingId}
            />

            {/* Payment */}
            <PaymentSelector selected={payment} onChange={setPayment} />
          </div>

          {/* ── Sidebar ──────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <OrderSummary
                subtotal={subtotal}
                shippingCost={shippingCost}
                total={total}
                itemCount={totalItems}
                onPlaceOrder={placeOrder}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────── */
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <svg
        className="w-24 h-24 mb-5 text-silver"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
      <h2 className="text-xl font-bold text-charcoal mb-2">سبد خرید شما خالی است</h2>
      <p className="text-sm text-gray-400 mb-8">
        محصولات مورد نظر خود را از فروشگاه انتخاب کنید.
      </p>
      <Link
        href="/products"
        className="bg-accent hover:bg-accent-dark text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors shadow hover:shadow-md"
      >
        مشاهده محصولات
      </Link>
    </div>
  );
}
