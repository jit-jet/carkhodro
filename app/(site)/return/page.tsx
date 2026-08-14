import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicReturnContent } from '@/actions/return-content';
import { buildStaticPageMetadata } from '@/src/lib/static-page-metadata';

export function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata('/return', { title: 'شرایط مرجوعی | کارخودرو', description: 'شرایط و ضوابط مرجوع کردن کالا در کارخودرو' });
}

export default async function ReturnPage() {
  const content = await getPublicReturnContent();
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="breadcrumb">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">شرایط مرجوعی</span>
          </nav>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-3xl font-black text-charcoal mb-6">شرایط مرجوعی کالا</h1>
          <div className="blog-body" dangerouslySetInnerHTML={{ __html: content.body }} />
        </div>
        <div className="text-center">
          <Link href="/contact" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">تماس با پشتیبانی</Link>
        </div>
      </div>
    </div>
  );
}
