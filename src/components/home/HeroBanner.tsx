import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-l from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px"
        }} />
      </div>

      {/* Gold accent line at top */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 text-accent text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              فروشگاه قطعات یدکی خودرو
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
              بهترین قیمت{" "}
              <span className="text-accent">قطعات یدکی</span>
              <br />
              خودروهای ایرانی و خارجی
            </h1>

            <p className="text-gray-300 text-base sm:text-lg leading-8 mb-8 max-w-lg">
              بیش از ۵۰,۰۰۰ قطعه اصل و درجه یک با ضمانت اصالت کالا و ارسال سریع به سراسر کشور.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-4 mb-10">
              {[
                { icon: "✓", text: "ضمانت اصالت کالا" },
                { icon: "✓", text: "ارسال سریع" },
                { icon: "✓", text: "پشتیبانی ۲۴ ساعته" },
              ].map((feat) => (
                <div key={feat.text} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-5 h-5 bg-accent text-charcoal rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {feat.icon}
                  </span>
                  {feat.text}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold px-8 py-3.5 rounded-xl transition-colors text-base"
              >
                مشاهده محصولات
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 rotate-180">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
              <Link
                href="/brands"
                className="inline-flex items-center gap-2 border-2 border-white/30 hover:border-accent text-white hover:text-accent font-bold px-8 py-3.5 rounded-xl transition-colors text-base"
              >
                جستجو بر اساس خودرو
              </Link>
            </div>
          </div>

          {/* Visual side */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative">
              {/* Big car emoji / illustration */}
              <div className="text-[10rem] sm:text-[13rem] leading-none select-none text-center drop-shadow-2xl">
                🚗
              </div>

              {/* Floating stat cards */}
              <div className="absolute -top-4 -end-4 bg-white text-charcoal rounded-2xl shadow-xl p-4 text-center min-w-28">
                <p className="text-2xl font-black text-accent">+۵۰K</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">قطعه موجود</p>
              </div>
              <div className="absolute -bottom-2 -start-4 bg-white text-charcoal rounded-2xl shadow-xl p-4 text-center min-w-28">
                <p className="text-2xl font-black text-green-600">۹۸٪</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">رضایت مشتریان</p>
              </div>
              <div className="absolute top-1/2 -start-10 sm:-start-20 bg-accent text-charcoal rounded-2xl shadow-xl p-4 text-center min-w-24">
                <p className="text-2xl font-black">+۱۲</p>
                <p className="text-xs font-medium mt-0.5">برند برتر</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 inset-x-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full">
          <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
