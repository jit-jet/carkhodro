'use client';

/**
 * Checkout orchestrator (client).
 * ───────────────────────────────
 * Owns the whole checkout interaction:
 *   • Order summary — read-only list of cart items + price breakdown.
 *   • Contact + delivery form — pre-filled from the user's saved profile, with
 *     an edit toggle; forced open when the profile is incomplete.
 *   • Shipping + payment selection (moved here from the cart).
 *   • Place order — validates, then calls `submitCheckout`, which persists the
 *     profile/address and creates the order in one transaction.
 *
 * Item quantities are edited back on the /cart page; here the list is read-only.
 */

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShippingSelector from '@/src/components/cart/ShippingSelector';
import PaymentSelector from '@/src/components/cart/PaymentSelector';
import OrderSummary from '@/src/components/cart/OrderSummary';
import CheckoutInfoForm from '@/src/components/checkout/CheckoutInfoForm';
import { submitCheckout } from '@/actions/orders';
import { useCartUI } from '@/src/store/cart-ui';
import type {
  CartVM,
  CheckoutContact,
  CheckoutProfileVM,
  ShippingOptionVM,
} from '@/src/lib/serializers';
import type { PaymentMethod } from '@/src/data/cartMockData';

interface Props {
  cart: CartVM;
  shippingOptions: ShippingOptionVM[];
  profile: CheckoutProfileVM;
}

type FieldErrors = Partial<Record<keyof CheckoutContact, string>>;

function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان';
}

function validate(c: CheckoutContact): FieldErrors {
  const errors: FieldErrors = {};
  if (!c.firstName.trim()) errors.firstName = 'نام الزامی است.';
  if (!c.lastName.trim()) errors.lastName = 'نام خانوادگی الزامی است.';
  if (!c.province) errors.province = 'لطفاً استان را انتخاب کنید.';
  if (!c.city.trim()) errors.city = 'شهر الزامی است.';
  if (!c.street.trim()) errors.street = 'آدرس الزامی است.';
  if (!/^\d{10}$/.test(c.postalCode)) errors.postalCode = 'کد پستی باید دقیقاً ۱۰ رقم باشد.';
  return errors;
}

export default function CheckoutView({ cart, shippingOptions, profile }: Props) {
  const router = useRouter();
  const setCount = useCartUI((s) => s.setCount);
  const notify = useCartUI((s) => s.notify);

  const [info, setInfo] = useState<CheckoutContact>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    province: profile.province,
    city: profile.city,
    street: profile.street,
    postalCode: profile.postalCode,
  });
  // Force the form open when the saved profile is incomplete.
  const [editing, setEditing] = useState(!profile.isComplete);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [shippingId, setShippingId] = useState(shippingOptions[0]?.id ?? '');
  const [payment, setPayment] = useState<PaymentMethod>('online');

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(false);

  const subtotal = cart.subtotal;
  const shippingCost = shippingOptions.find((s) => s.id === shippingId)?.cost ?? 0;
  const total = subtotal + shippingCost;

  function patchInfo(patch: Partial<CheckoutContact>) {
    setInfo((prev) => ({ ...prev, ...patch }));
    // Clear the error for any field being edited.
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch) as (keyof CheckoutContact)[]) delete next[key];
      return next;
    });
  }

  function placeOrder() {
    setError('');
    const found = validate(info);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setEditing(true);
      setError('لطفاً اطلاعات گیرنده و آدرس را تکمیل کنید.');
      return;
    }
    if (!shippingId) {
      setError('لطفاً روش ارسال را انتخاب کنید.');
      return;
    }

    startTransition(async () => {
      const result = await submitCheckout({
        shippingOptionId: shippingId,
        paymentMethod: payment === 'online' ? 'ONLINE' : 'COD',
        contact: info,
      });
      if (result.ok) {
        setPlaced(true);
        setCount(0);
        notify({ variant: 'success', title: 'سفارش شما ثبت شد', description: 'سپاس از خرید شما 🎉' });
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (placed) return <CheckoutSuccess paymentOnline={payment === 'online'} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Order items (read-only) */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-charcoal">
              محصولات سفارش ({cart.items.length.toLocaleString('fa-IR')})
            </h2>
            <Link href="/cart" className="text-xs font-semibold text-accent-dark hover:underline">
              ویرایش سبد خرید
            </Link>
          </div>
          <ul className="divide-y divide-gray-50">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-4">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                  <Image src={item.image} alt={item.name} fill sizes="56px" className="object-contain p-1.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.quantity.toLocaleString('fa-IR')} × {formatPrice(item.price)}
                  </p>
                </div>
                <span className="text-sm font-bold text-charcoal shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <CheckoutInfoForm
          value={info}
          onChange={patchInfo}
          phoneNumber={profile.phoneNumber}
          editing={editing}
          onEdit={() => setEditing(true)}
          errors={errors}
        />

        <ShippingSelector options={shippingOptions} selected={shippingId} onChange={setShippingId} />

        <PaymentSelector selected={payment} onChange={setPayment} />
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <OrderSummary
            subtotal={subtotal}
            shippingCost={shippingCost}
            total={total}
            itemCount={cart.totalItems}
            ctaLabel={payment === 'online' ? 'پرداخت و ثبت سفارش' : 'ثبت سفارش'}
            onPlaceOrder={placeOrder}
            busy={pending}
          />
          {pending && (
            <p className="text-center text-xs text-gray-400 mt-3">در حال ثبت سفارش…</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckoutSuccess({ paymentOnline }: { paymentOnline: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-5">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-charcoal mb-2">سفارش شما با موفقیت ثبت شد</h2>
      <p className="text-sm text-gray-400 mb-8">
        {paymentOnline
          ? 'پرداخت با موفقیت انجام شد. جزئیات سفارش در داشبورد شما در دسترس است. 🎉'
          : 'سفارش شما ثبت شد و هنگام تحویل پرداخت می‌شود. 🎉'}
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="bg-accent hover:bg-accent-dark text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors shadow hover:shadow-md"
        >
          مشاهده سفارش‌ها
        </Link>
        <Link
          href="/products"
          className="border-2 border-silver hover:border-accent text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          ادامه خرید
        </Link>
      </div>
    </div>
  );
}
