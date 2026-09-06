import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getInvoiceContent } from '@/actions/admin-invoice-content';
import { PageHeader } from '@/src/components/admin/AdminUI';
import InvoiceContentForm from '@/src/components/admin/InvoiceContentForm';

export const metadata: Metadata = { title: 'محتوای فاکتور | پنل مدیریت' };

export default function AdminInvoiceContentPage() {
  return (
    <div>
      <PageHeader
        title="محتوای فاکتور"
        description="مدیریت اطلاعات فروشنده، پرداخت و توضیحات فاکتور فروش"
      />
      <Suspense fallback={<InvoiceContentSkeleton />}>
        <AdminInvoiceContent />
      </Suspense>
    </div>
  );
}

async function AdminInvoiceContent() {
  const content = await getInvoiceContent();
  return <InvoiceContentForm initial={content} />;
}

function InvoiceContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-2xl border border-gray-100 bg-white" />
      <div className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-white" />
      <div className="h-80 animate-pulse rounded-2xl border border-gray-100 bg-white" />
    </div>
  );
}
