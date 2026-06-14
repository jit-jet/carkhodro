import Link from "next/link";

const quickLinks = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/products?category=engine", label: "قطعات موتوری" },
  { href: "/products?category=body", label: "بدنه و شیشه" },
  { href: "/products?category=electrical", label: "برق خودرو" },
  { href: "/products", label: "لوازم جانبی" },
  { href: "/products", label: "همه برندها" },
];

const categoryLinks = [
  { href: "/products?category=engine", label: "موتور و قطعات" },
  { href: "/products?category=brake", label: "ترمز و تعلیق" },
  { href: "/products?category=cooling", label: "سیستم خنک‌کننده" },
  { href: "/products?category=electrical", label: "برق و روشنایی" },
  { href: "/products?category=oil", label: "روغن و مایعات" },
  { href: "/products", label: "فیلترها" },
];

const infoLinks = [
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
  { href: "/faq", label: "سوالات متداول" },
  { href: "/return", label: "شرایط مرجوعی" },
  { href: "/warranty", label: "ضمانت کالا" },
  { href: "/blog", label: "وبلاگ" },
];

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.66a16 16 0 006.25 6.25l1.18-1.18a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      {/* Trust badges */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: "🛡️", title: "ضمانت اصالت کالا", desc: "تمام محصولات اصلی" },
              { icon: "🚚", title: "ارسال سریع", desc: "به سراسر کشور" },
              { icon: "↩️", title: "بازگشت آسان", desc: "تا ۷ روز ضمانت برگشت" },
              { icon: "🎧", title: "پشتیبانی ۲۴/۷", desc: "همیشه در کنار شما" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="text-2xl font-black text-accent mb-3">کارخودرو</div>
            <p className="text-sm text-gray-400 leading-7 mb-4">
              بزرگترین فروشگاه آنلاین قطعات یدکی خودروهای ایرانی و خارجی با بیش از ۵۰,۰۰۰ قطعه اصل و ضمانت اصالت کالا.
            </p>
            <div className="flex gap-3">
              {["📘", "📸", "📢", "💬"].map((icon, i) => (
                <button key={i} className="w-9 h-9 bg-white/10 hover:bg-accent hover:text-charcoal rounded-lg flex items-center justify-center transition-colors text-sm">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-accent rounded-full inline-block" />
              لینک‌های سریع
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href+link.label}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-accent transition-colors flex items-center gap-2">
                    <span className="text-accent">‹</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-accent rounded-full inline-block" />
              دسته‌بندی‌ها
            </h3>
            <ul className="space-y-2.5">
              {categoryLinks.map((link) => (
                <li key={link.href+link.label}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-accent transition-colors flex items-center gap-2">
                    <span className="text-accent">‹</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-accent rounded-full inline-block" />
              اطلاعات تماس
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <PhoneIcon />
                <div>
                  <p>۰۲۱-۸۸۱۲۳۴۵۶</p>
                  <p>۰۲۱-۸۸۶۵۴۳۲۱</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <MailIcon />
                <span>info@carkhodro.ir</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPinIcon />
                <span>تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۲۴۱</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <ClockIcon />
                <span>شنبه تا چهارشنبه: ۸ تا ۲۰ | پنجشنبه: ۸ تا ۱۴</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <p className="font-semibold">عضویت در خبرنامه</p>
            <p className="text-xs text-gray-400">از آخرین تخفیف‌ها و محصولات جدید مطلع شوید</p>
          </div>
          <div className="flex w-full sm:w-auto">
            <input
              type="email"
              placeholder="ایمیل خود را وارد کنید"
              className="flex-1 sm:w-64 bg-white/10 border border-white/20 rounded-s-xl px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
            />
            <button className="bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm px-5 py-2.5 rounded-e-xl transition-colors flex-shrink-0">
              عضویت
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© ۱۴۰۳ کارخودرو — تمامی حقوق محفوظ است.</p>
          <div className="flex gap-4">
            {infoLinks.slice(0, 3).map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-accent transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
