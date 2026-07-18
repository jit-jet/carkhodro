/**
 * Invoice detail — «فاکتور».
 * Printable wholesale sales invoice for one order. Scoped to the owner;
 * streams inside <Suspense>.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getInvoice } from '@/actions/dashboard-orders';
import PrintButton from '@/src/components/dashboard/PrintButton';
import InvoicePrint from '@/src/components/dashboard/InvoicePrint';

export const metadata: Metadata = {
  title: 'فاکتور | فروشگاه اینترنتی کارخودرو',
};

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <InvoiceContent params={params} />
    </Suspense>
  );
}

async function InvoiceContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/dashboard/orders"
          className="flex items-center gap-1.5 text-sm font-semibold text-charcoal hover:text-accent-dark transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          بازگشت به سفارشات
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/orders/${invoice.id}/survey`}
            className="text-sm font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors"
          >
            {invoice.hasSurvey ? 'ویرایش نظرسنجی' : 'ثبت نظرسنجی'}
          </Link>
          <PrintButton label="چاپ / ذخیره PDF" />
        </div>
      </div>

      <div className="print-area bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 lg:p-8 print:rounded-none print:border-0 print:shadow-none print:p-0">
        <InvoicePrint invoice={invoice} />
      </div>

      <div className="no-print flex justify-center pt-1 pb-4">
        <PrintButton label="چاپ / ذخیره PDF" />
      </div>
    </div>
  );
}

function InvoiceSkeleton() {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[32rem] animate-pulse" />;
}
