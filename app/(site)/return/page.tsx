import Link from 'next/link';

export default function ReturnPage() {
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">شرایط مرجوعی</span>
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-3xl font-black text-charcoal mb-6">شرایط مرجوعی کالا</h1>

          <div className="space-y-6 text-sm text-gray-600 leading-8">
            <section>
              <h2 className="text-base font-bold text-charcoal mb-3">مهلت مرجوعی</h2>
              <p>مشتریان تا <strong className="text-charcoal">۷ روز کاری</strong> پس از دریافت کالا، در صورت رعایت شرایط زیر، می‌توانند درخواست مرجوعی ثبت نمایند.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-charcoal mb-3">شرایط مرجوعی</h2>
              <ul className="space-y-2">
                {[
                  'کالا نصب یا استفاده نشده باشد.',
                  'بسته‌بندی اصلی کالا سالم و دست‌نخورده باشد.',
                  'تمام اجزاء، برچسب‌ها و اسناد همراه کالا موجود باشند.',
                  'کالا آسیب‌دیدگی فیزیکی ناشی از خطای خریدار نداشته باشد.',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-charcoal mb-3">موارد عدم پذیرش مرجوعی</h2>
              <ul className="space-y-2">
                {[
                  'کالاهای نصب یا مورد استفاده قرار گرفته.',
                  'کالاهای آسیب‌دیده توسط خریدار.',
                  'گذشت بیش از ۷ روز از تاریخ دریافت.',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold mt-0.5">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-charcoal mb-3">فرآیند مرجوعی</h2>
              <ol className="space-y-2 list-decimal list-inside">
                <li>با پشتیبانی تماس بگیرید و کد مرجوعی دریافت کنید.</li>
                <li>کالا را با بسته‌بندی اصلی به آدرس انبار ارسال نمایید.</li>
                <li>پس از بررسی، وجه در ۳ تا ۵ روز کاری به حساب شما بازگشت داده می‌شود.</li>
              </ol>
            </section>
          </div>
        </div>

        <div className="text-center">
          <Link href="/contact" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
            تماس با پشتیبانی
          </Link>
        </div>
      </div>
    </div>
  );
}
