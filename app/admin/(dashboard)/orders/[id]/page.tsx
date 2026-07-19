import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderAdminById, getInvoiceAdmin } from "@/actions/admin-orders";
import { PageHeader } from "@/src/components/admin/AdminUI";
import OrderEditForm from "@/src/components/admin/OrderEditForm";
import InvoicePrint from "@/src/components/dashboard/InvoicePrint";
import PrintButton from "@/src/components/dashboard/PrintButton";

export const metadata: Metadata = { title: "جزئیات سفارش | پنل مدیریت" };

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}

async function OrderDetailContent({ params }: Props) {
  const { id } = await params;
  const [order, invoice] = await Promise.all([
    getOrderAdminById(id),
    getInvoiceAdmin(id),
  ]);
  if (!order || !invoice) notFound();

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title={`جزئیات سفارش #${order.orderNumber.toLocaleString("fa-IR")}`}
          description={order.createdAtLabel}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/admin/orders"
                className="text-sm font-semibold text-charcoal hover:text-accent-dark"
              >
                بازگشت به لیست
              </Link>
              <PrintButton label="چاپ فاکتور" />
            </div>
          }
        />
        <OrderEditForm order={order} />
      </div>

      <div className="no-print flex items-center justify-between gap-3 flex-wrap pt-2">
        <h2 className="font-bold text-charcoal">پیش‌نمایش فاکتور</h2>
        <PrintButton label="چاپ / ذخیره PDF" />
      </div>

      <div className="print-area bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 lg:p-8 print:rounded-none print:border-0 print:shadow-none print:p-0">
        <InvoicePrint invoice={invoice} />
      </div>

      <div className="no-print flex justify-center pb-4">
        <PrintButton label="چاپ / ذخیره PDF" />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
