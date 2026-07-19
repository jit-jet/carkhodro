"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateOrderAdmin,
  type AdminOrderDetailVM,
  type AdminOrderUpdateInput,
} from "@/actions/admin-orders";
import {
  ORDER_STATUS_FA,
  ORDER_STATUS_ORDER,
  PAYMENT_METHOD_FA,
  PAYMENT_STATUS_FA,
} from "@/src/lib/order-labels";
import { PAYMENT_TERMS } from "@/src/lib/dashboard-options";
import { useCartUI } from "@/src/store/cart-ui";
import {
  Button,
  Card,
  FormError,
  FormSuccess,
  Input,
  Label,
  Select,
  Textarea,
} from "@/src/components/admin/AdminUI";
import { formatToman, noFormatNumberFa } from "@/src/lib/format";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma_client";

export default function OrderEditForm({ order }: { order: AdminOrderDetailVM }) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod);
  const [paymentTerms, setPaymentTerms] = useState(order.paymentTerms ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [trackingCode, setTrackingCode] = useState(order.trackingCode ?? "");
  const [province, setProvince] = useState(order.snapshotProvince);
  const [city, setCity] = useState(order.snapshotCity);
  const [street, setStreet] = useState(order.snapshotStreet);
  const [postalCode, setPostalCode] = useState(order.snapshotPostalCode);
  const [firstName, setFirstName] = useState(order.user.firstName);
  const [lastName, setLastName] = useState(order.user.lastName);
  const [phone, setPhone] = useState(order.user.phoneNumber);
  const [shopName, setShopName] = useState(order.user.shopName ?? "");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const input: AdminOrderUpdateInput = {
      status,
      paymentStatus,
      paymentMethod,
      paymentTerms: paymentTerms || null,
      notes: notes || null,
      trackingCode: trackingCode || null,
      snapshotProvince: province,
      snapshotCity: city,
      snapshotStreet: street,
      snapshotPostalCode: postalCode,
      customerFirstName: firstName,
      customerLastName: lastName,
      customerPhone: phone,
      customerShopName: shopName || null,
    };

    startTransition(async () => {
      const result = await updateOrderAdmin(order.id, input);
      if (!result.ok) return setError(result.error);
      const message = "اطلاعات سفارش با موفقیت ذخیره شد.";
      setSuccess(message);
      notify({ variant: "success", title: "ذخیره موفق", description: message });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 no-print">
      {error && <FormError message={error} />}
      {success && <FormSuccess message={success} />}

      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-charcoal">
            سفارش #{noFormatNumberFa(order.orderNumber)}
          </h2>
          <p className="text-xs text-gray-400">{order.createdAtLabel}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>وضعیت سفارش</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
              {ORDER_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_FA[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>وضعیت پرداخت</Label>
            <Select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            >
              {(Object.keys(PAYMENT_STATUS_FA) as PaymentStatus[]).map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_STATUS_FA[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>روش پرداخت</Label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              {(Object.keys(PAYMENT_METHOD_FA) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_FA[m]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>شرایط تسویه</Label>
            <Select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
              <option value="">—</option>
              {PAYMENT_TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>کد پیگیری ارسال</Label>
            <Input
              dir="ltr"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>یادداشت</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Card>

      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-charcoal">اطلاعات مشتری</h2>
          <Link
            href={`/admin/users/${order.user.id}`}
            className="text-xs font-semibold text-accent-dark hover:underline"
          >
            صفحه کاربر
          </Link>
        </div>
        <p className="text-xs text-gray-400">نقش: {order.user.roleLabel}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>نام</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <Label>نام خانوادگی</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div>
            <Label>موبایل</Label>
            <Input
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>نام فروشگاه</Label>
            <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="font-bold text-charcoal">آدرس تحویل (اسنپ‌شات سفارش)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>استان</Label>
            <Input value={province} onChange={(e) => setProvince(e.target.value)} required />
          </div>
          <div>
            <Label>شهر</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <Label>آدرس</Label>
            <Textarea rows={2} value={street} onChange={(e) => setStreet(e.target.value)} required />
          </div>
          <div>
            <Label>کد پستی</Label>
            <Input
              dir="ltr"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6 space-y-3">
        <h2 className="font-bold text-charcoal">اقلام سفارش</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-gray-500">
              <tr className="border-b border-gray-100">
                <th className="text-right py-2 font-semibold">کالا</th>
                <th className="text-right py-2 font-semibold">تعداد</th>
                <th className="text-right py-2 font-semibold">قیمت واحد</th>
                <th className="text-right py-2 font-semibold">تخفیف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2.5">
                    <p className="font-semibold text-charcoal">{it.productName}</p>
                    <p className="text-xs text-gray-400 font-mono">{it.productSku}</p>
                  </td>
                  <td className="py-2.5">{noFormatNumberFa(it.quantity)}</td>
                  <td className="py-2.5 whitespace-nowrap">{formatToman(it.unitPriceToman)}</td>
                  <td className="py-2.5">٪{noFormatNumberFa(it.discountPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 pt-2 text-sm">
          <p className="text-gray-500">
            جمع جزء: <span className="font-bold text-charcoal">{formatToman(order.subtotalToman)}</span>
          </p>
          <p className="text-gray-500">
            ارسال:{" "}
            <span className="font-bold text-charcoal">{formatToman(order.shippingCostToman)}</span>
          </p>
          <p className="text-gray-500">
            قابل پرداخت:{" "}
            <span className="font-extrabold text-accent-dark">{formatToman(order.totalToman)}</span>
          </p>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/orders")}>
          بازگشت به لیست
        </Button>
      </div>
    </form>
  );
}
