import Image from 'next/image';

const FEATURES = [
  {
    title: 'قیمت‌های ویژه همکاری',
    description: 'مشاهده قیمت‌های مخصوص همکاران و موجودی به‌روز قطعات',
    icon: 'tag',
  },
  {
    title: 'ثبت سریع سفارش',
    description: 'ساخت سبد خرید و ثبت فاکتور همکاری در چند مرحله کوتاه',
    icon: 'cart',
  },
  {
    title: 'فاکتور و لیست قیمت',
    description: 'دسترسی سریع به سفارش‌ها، فاکتورها و لیست قیمت اختصاصی',
    icon: 'invoice',
  },
  {
    title: 'پشتیبانی همیشه در دسترس',
    description: 'ارسال و پیگیری درخواست‌ها از پنل اختصاصی همکاران',
    icon: 'support',
  },
] as const;

type FeatureIcon = (typeof FEATURES)[number]['icon'];

function FeatureIconSvg({ icon }: { icon: FeatureIcon }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'h-5 w-5',
    'aria-hidden': true,
  };

  switch (icon) {
    case 'tag':
      return (
        <svg {...common}>
          <path d="M20.59 13.41 11 23l-10-10V3h10l9.59 9.59a1.16 1.16 0 0 1 0 1.64Z" />
          <circle cx="6.5" cy="8.5" r="1.5" />
        </svg>
      );
    case 'cart':
      return (
        <svg {...common}>
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
          <path d="M3 4h2l2.4 10.1a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 1.9-1.4L21 8H6" />
        </svg>
      );
    case 'invoice':
      return (
        <svg {...common}>
          <path d="M6 2h9l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          <path d="M14 2v5h5M8 12h7M8 16h7" />
        </svg>
      );
    case 'support':
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
          <path d="M8 10h.01M12 10h.01M16 10h.01" />
        </svg>
      );
  }
}

export default function AndroidAppDownload() {
  return (
    <section className="bg-white px-4 py-10 sm:py-14" aria-labelledby="android-app-title">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-charcoal text-white shadow-xl shadow-gray-300/40">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-accent/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-36 left-12 h-80 w-80 rounded-full bg-white/5 blur-2xl" />

        <div className="relative grid items-center gap-10 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14 lg:px-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-amber-200">
              <span className="h-2 w-2 rounded-full bg-accent" />
              ویژه همکاران کارخودرو
            </div>

            <h2 id="android-app-title" className="text-2xl font-black leading-relaxed sm:text-3xl lg:text-4xl">
              کارخودرو همیشه همراه شماست
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
              با اپلیکیشن اندروید کارخودرو، قیمت‌ها و ابزارهای مورد نیاز کسب‌وکارتان را
              سریع‌تر و ساده‌تر در اختیار داشته باشید.
            </p>

            <ul className="mt-7 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent">
                    <FeatureIconSvg icon={feature.icon} />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-white">{feature.title}</span>
                    <span className="mt-1 block text-xs leading-6 text-gray-400">
                      {feature.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <a
                href="/downloads/android"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-black text-charcoal shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-accent-dark focus-visible:outline-white sm:w-auto"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                دانلود مستقیم نسخه اندروید
              </a>
              <span className="text-xs text-gray-400">فایل APK · نصب مستقیم روی اندروید</span>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-sm lg:block" aria-hidden="true">
            <div className="absolute inset-x-8 bottom-2 h-16 rounded-full bg-accent/20 blur-2xl" />
            <div className="relative mx-auto w-64 -rotate-3 rounded-[2.7rem] border-[7px] border-gray-700 bg-gray-950 p-2 shadow-2xl transition-transform duration-500 hover:rotate-0">
              <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-gray-950" />
              <div className="overflow-hidden rounded-[2rem] bg-[#fcf8f0]">
                <div className="flex h-10 items-center justify-between bg-white px-4 pt-1 text-[9px] font-bold text-charcoal">
                  <span>۹:۴۱</span>
                  <span className="flex gap-1"><i className="h-1.5 w-1.5 rounded-full bg-charcoal" /><i className="h-1.5 w-3 rounded-sm bg-charcoal" /></span>
                </div>
                <div className="flex items-center gap-2 border-y border-gray-100 bg-white px-4 py-3">
                  <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
                  <div>
                    <p className="text-[10px] font-black text-charcoal">کارخودرو</p>
                    <p className="text-[7px] text-gray-400">پنل اختصاصی همکاران</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="rounded-2xl bg-charcoal p-4 text-right text-white">
                    <p className="text-[8px] text-gray-300">سلام، همکار گرامی</p>
                    <p className="mt-1 text-sm font-black">همه‌چیز آماده سفارش است</p>
                    <div className="mt-3 h-1.5 w-24 rounded-full bg-accent" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {['قیمت همکاری', 'سفارش‌ها', 'لیست قیمت', 'پشتیبانی'].map((label, index) => (
                      <div key={label} className="rounded-xl bg-white p-3 shadow-sm">
                        <span className={`mb-2 block h-6 w-6 rounded-lg ${index === 0 ? 'bg-accent' : 'bg-silver-light'}`} />
                        <p className="text-[8px] font-bold text-charcoal">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl bg-white p-3 shadow-sm">
                    <div className="mb-2 h-2 w-20 rounded-full bg-gray-200" />
                    <div className="h-2 w-full rounded-full bg-gray-100" />
                    <div className="mt-2 h-2 w-3/4 rounded-full bg-gray-100" />
                  </div>
                </div>
                <div className="mx-auto mb-2 h-1 w-24 rounded-full bg-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
