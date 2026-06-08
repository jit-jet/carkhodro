import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">تماس با ما</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-3xl font-black text-charcoal mb-6">تماس با ما</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: '📞', title: 'تلفن', lines: ['۰۲۱-۸۸۱۲۳۴۵۶', '۰۲۱-۸۸۶۵۴۳۲۱'] },
              { icon: '📧', title: 'ایمیل', lines: ['info@carkhodro.ir'] },
              { icon: '📍', title: 'آدرس', lines: ['تهران، خیابان ولیعصر،', 'بالاتر از میدان ونک، پلاک ۲۴۱'] },
              { icon: '🕐', title: 'ساعات کاری', lines: ['شنبه تا چهارشنبه: ۸ تا ۲۰', 'پنجشنبه: ۸ تا ۱۴'] },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4 bg-silver-light rounded-xl p-5">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h3 className="font-bold text-charcoal mb-1">{item.title}</h3>
                  {item.lines.map(l => (
                    <p key={l} className="text-sm text-gray-600">{l}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-charcoal mb-5">ارسال پیام</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">نام و نام خانوادگی</label>
                <input type="text" placeholder="مثال: علی احمدی" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">شماره تماس</label>
                <input type="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">موضوع</label>
              <input type="text" placeholder="موضوع پیام خود را بنویسید" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">پیام</label>
              <textarea rows={5} placeholder="پیام خود را بنویسید..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors resize-none leading-7" />
            </div>
            <button type="submit" className="bg-accent hover:bg-accent-dark text-charcoal font-bold px-8 py-3 rounded-xl transition-colors">
              ارسال پیام
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
