import Link from 'next/link';

export default function WarrantyPage() {
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">ضمانت کالا</span>
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-3xl font-black text-charcoal mb-6">ضمانت کالا</h1>

          <div className="space-y-6 text-sm text-gray-600 leading-8">
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-5 flex items-start gap-4">
              <span className="text-3xl">🛡️</span>
              <div>
                <h2 className="font-bold text-charcoal mb-1">ضمانت اصالت کالا</h2>
                <p>تمامی محصولات کارخودرو دارای ضمانت اصالت هستند. در صورت مشاهده هر گونه تقلبی وجه به طور کامل بازگشت داده می‌شود.</p>
              </div>
            </div>

            <section>
              <h2 className="text-base font-bold text-charcoal mb-3">انواع ضمانت</h2>
              <div className="space-y-3">
                {[
                  { title: 'ضمانت ۶ ماهه', desc: 'برای قطعات الکترونیکی و برقی خودرو.' },
                  { title: 'ضمانت ۱ ساله', desc: 'برای قطعات موتوری و مکانیکی اصلی.' },
                  { title: 'ضمانت ۲ ساله', desc: 'برای قطعات برندهای معتبر اروپایی.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 bg-silver-light rounded-xl p-4">
                    <span className="text-accent font-black mt-0.5">✓</span>
                    <div>
                      <h3 className="font-semibold text-charcoal">{item.title}</h3>
                      <p className="text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-base font-bold text-charcoal mb-3">شرایط ضمانت</h2>
              <ul className="space-y-2">
                {[
                  'خرابی ناشی از عیب کارخانه‌ای پوشش داده می‌شود.',
                  'آسیب ناشی از نصب نادرست یا استفاده غیرصحیح تحت پوشش نیست.',
                  'برای استفاده از ضمانت، فاکتور خرید الزامی است.',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="text-center">
          <Link href="/contact" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
            ثبت درخواست ضمانت
          </Link>
        </div>
      </div>
    </div>
  );
}
