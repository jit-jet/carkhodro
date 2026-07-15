import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'صفحه پیدا نشد | کارخودرو',
};

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center text-center" dir="rtl">
      <p className="text-7xl sm:text-8xl font-black text-accent mb-4 select-none">۴۰۴</p>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal mb-3">
        صفحه پیدا نشد
      </h1>

      <p className="text-sm text-gray-500 leading-7 mb-8 max-w-md">
        صفحه‌ای که به دنبال آن هستید وجود ندارد یا جابه‌جا شده است.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          href="/"
          className="w-full sm:w-auto bg-accent hover:bg-accent-dark text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors shadow hover:shadow-md text-center"
        >
          بازگشت به خانه
        </Link>
        <Link
          href="/products"
          className="w-full sm:w-auto border-2 border-silver hover:border-accent text-charcoal font-semibold px-8 py-3 rounded-xl transition-colors text-center"
        >
          مشاهده محصولات
        </Link>
      </div>
    </div>
  );
}
