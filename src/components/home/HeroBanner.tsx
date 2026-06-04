import Image from "next/image";
import Link from "next/link";

// Inline animation helper — only transform+opacity, GPU-friendly
const anim = (name: string, dur: string, delay: string) =>
  ({ animation: `${name} ${dur} ease-out ${delay} both` }) as React.CSSProperties;

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-l from-gray-800  to-gray-600 text-white">
      {/* Background dot pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Gold accent line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* ── Text content ── */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <span
              style={anim("fade-in-up", "0.5s", "0.05s")}
              className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 text-accent text-sm font-medium px-4 py-1.5 rounded-full mb-6"
            >
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              فروشگاه قطعات یدکی خودرو
            </span>

            {/* Headline */}
            <h1
              style={anim("fade-in-up", "0.6s", "0.18s")}
              className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4"
            >
              بهترین قیمت{" "}
              <span className="text-accent">قطعات یدکی</span>
              <br />
              خودروهای ایرانی و خارجی
            </h1>

            {/* Subtitle */}
            <p
              style={anim("fade-in-up", "0.6s", "0.32s")}
              className="text-gray-300 text-base sm:text-lg leading-8 mb-8 max-w-lg"
            >
              بیش از ۵۰,۰۰۰ قطعه اصل و درجه یک با ضمانت اصالت کالا و ارسال سریع به سراسر کشور.
            </p>

            {/* Feature badges */}
            <div
              style={anim("fade-in-up", "0.55s", "0.46s")}
              className="flex flex-wrap gap-4 mb-10"
            >
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

            {/* CTA buttons */}
            <div
              style={anim("fade-in-up", "0.55s", "0.58s")}
              className="flex flex-wrap gap-3"
            >
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-base"
              >
                مشاهده محصولات
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 rotate-180">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
              <Link
                href="/brands"
                className="inline-flex items-center gap-2 border-2 border-white/30 hover:border-accent text-white hover:text-accent font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-base"
              >
                جستجو بر اساس خودرو
              </Link>
            </div>
          </div>

          {/* ── Visual side ── */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative">
              {/* Car icon — floats after fade-in */}
              <div
                style={{
                  animation:
                    "fade-in 0.7s ease-out 0.3s both, float 5s ease-in-out 1.1s infinite",
                  willChange: "transform",
                }}
                className="text-[10rem] sm:text-[13rem] leading-none select-none text-center drop-shadow-2xl"
              >
                {/* 🚗 */}
                
                <Image src={"/tranrse-car.png"} height={500} width={700} alt="auto spare shop"/>
              </div>
              {/* Stat card 1 */}
              <div
                style={{ animation: "fade-in-up 0.5s ease-out 0.7s both, float 4s ease-in-out 1.5s infinite", willChange: "transform" }}
                className="absolute -top-4 -end-4 bg-white text-charcoal rounded-2xl shadow-xl p-4 text-center min-w-28"
              >
                <p className="text-2xl font-black text-accent">+۵۰K</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">قطعه موجود</p>
              </div>

              {/* Stat card 2 */}
              <div
                style={{ animation: "fade-in-up 0.5s ease-out 0.85s both, float 4.5s ease-in-out 1.7s infinite", willChange: "transform" }}
                className="absolute -bottom-2 max-md:bottom-28 -start-4 bg-white text-charcoal rounded-2xl shadow-xl p-4 text-center min-w-28"
              >
                <p className="text-2xl font-black text-green-600">۹۸٪</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">رضایت مشتریان</p>
              </div>

              {/* Stat card 3 */}
              <div
                style={{ animation: "fade-in-up 0.5s ease-out 1.0s both, float 3.8s ease-in-out 1.9s infinite", willChange: "transform" }}
                className="absolute top-1/2 -start-10 sm:-start-20 bg-accent text-charcoal rounded-2xl shadow-xl p-4 text-center min-w-24"
              >
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
