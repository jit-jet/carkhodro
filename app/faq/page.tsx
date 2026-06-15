import type { Metadata } from 'next/types';
import Link from 'next/link';
import { getFaqs } from '@/actions/faq';
import FaqAccordion from '@/src/components/faq/FaqAccordion';

export const metadata: Metadata = {
  title: 'سوالات متداول | کارخودرو',
  description: 'پاسخ سوالات رایج درباره خرید قطعه خودرو، ارسال، مرجوعی و گارانتی.',
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav aria-label="مسیر صفحه" className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span aria-hidden="true" className="text-gray-300">/</span>
            <span className="text-charcoal font-medium" aria-current="page">سوالات متداول</span>
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-charcoal mb-8 text-center">سوالات متداول</h1>

        {faqs.length > 0 ? (
          <FaqAccordion faqs={faqs} />
        ) : (
          <p className="text-center text-gray-500">در حال حاضر سوالی ثبت نشده است.</p>
        )}

        <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-gray-600 mb-4">پاسخ سوالتان را نیافتید؟</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            تماس با پشتیبانی
          </Link>
        </div>
      </div>
    </div>
  );
}
