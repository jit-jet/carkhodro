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
  CardHeader,
  FormError,
  FormSuccess,
  Input,
  Label,
  Select,
  Textarea,
  tableBodyClass,
  tableHeadClass,
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
  const phone = order.user.phoneNumber;
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

      <Card className="overflow-hidden">
        <CardHeader
          title={`سفارش #${noFormatNumberFa(order.orderNumber)}`}
          action={<p className="text-xs text-gray-400">{order.createdAtLabel}</p>}
        />
        <div className="p-5 sm:p-6 space-y-4">

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
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="اطلاعات مشتری"
          description={`نقش: ${order.user.roleLabel}`}
          action={
            <Link
              href={`/admin/users/${order.user.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-charcoal hover:bg-silver-light transition-colors"
            >
              صفحه کاربر
            </Link>
          }
        />
        <div className="p-5 sm:p-6 space-y-4">
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
              disabled
              readOnly
              title="شماره موبایل قابل تغییر نیست"
            />
          </div>
          <div>
            <Label>نام فروشگاه</Label>
            <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
          </div>
        </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="آدرس تحویل (اسنپ‌شات سفارش)" />
        <div className="p-5 sm:p-6 space-y-4">
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
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="اقلام سفارش" />
        <div className="p-5 sm:p-6 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className={tableHeadClass}>
              <tr>
                <th className="text-right py-2.5 px-2 font-semibold text-xs uppercase tracking-wide text-gray-500">کالا</th>
                <th className="text-right py-2.5 px-2 font-semibold text-xs uppercase tracking-wide text-gray-500">تعداد</th>
                <th className="text-right py-2.5 px-2 font-semibold text-xs uppercase tracking-wide text-gray-500">قیمت واحد</th>
                <th className="text-right py-2.5 px-2 font-semibold text-xs uppercase tracking-wide text-gray-500">تخفیف</th>
              </tr>
            </thead>
            <tbody className={tableBodyClass}>
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2.5 px-2">
                    <p className="font-semibold text-charcoal">{it.productName}</p>
                    <p className="text-xs text-gray-400 font-mono">{it.productSku}</p>
                  </td>
                  <td className="py-2.5 px-2">{noFormatNumberFa(it.quantity)}</td>
                  <td className="py-2.5 px-2 whitespace-nowrap">{formatToman(it.unitPriceToman)}</td>
                  <td className="py-2.5 px-2">٪{noFormatNumberFa(it.discountPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 pt-2 text-sm bg-gray-50 rounded-xl border border-gray-100 p-4">
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
