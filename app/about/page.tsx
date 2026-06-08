import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">درباره ما</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-3xl font-black text-charcoal mb-4">درباره کارخودرو</h1>
          <p className="text-gray-600 leading-8 mb-6">
            کارخودرو بزرگترین فروشگاه آنلاین قطعات یدکی خودروهای ایرانی و خارجی است. با بیش از ۵۰,۰۰۰
            قطعه اصل و ضمانت اصالت کالا، ما مطمئن‌ترین مقصد خرید قطعات خودرو در ایران هستیم.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value: '+۵۰K', label: 'قطعه موجود' },
              { value: '+۱۲', label: 'برند معتبر' },
              { value: '۹۸٪', label: 'رضایت مشتریان' },
            ].map(stat => (
              <div key={stat.label} className="bg-silver-light rounded-xl p-5 text-center">
                <p className="text-3xl font-black text-accent">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
          <h2 className="text-xl font-bold text-charcoal">ارزش‌های ما</h2>
          {[
            { icon: '🛡️', title: 'ضمانت اصالت کالا', desc: 'تمامی محصولات از منابع معتبر تأمین می‌شوند.' },
            { icon: '🚚', title: 'ارسال سریع', desc: 'تحویل به سراسر کشور در کمتر از ۴۸ ساعت.' },
            { icon: '🎧', title: 'پشتیبانی ۲۴/۷', desc: 'تیم کارشناسان ما همیشه آماده پاسخگویی هستند.' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-silver-light">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h3 className="font-bold text-charcoal">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/products" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold px-8 py-3 rounded-xl transition-colors">
            مشاهده محصولات
          </Link>
        </div>
      </div>
    </div>
  );
}
