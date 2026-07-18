/**
 * Rules & Terms Page — /rules
 * ────────────────────────────
 * Static server-rendered page containing the Terms and Conditions.
 * Linked from PhoneStep ("ورود → قوانین") and SignupForm checkbox.
 */

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'قوانین و مقررات | کارخودرو',
  description: 'قوانین و شرایط استفاده از خدمات فروشگاه آنلاین کارخودرو',
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '۱. پذیرش شرایط',
    body: [
      'استفاده از وب‌سایت کارخودرو به منزله‌ی مطالعه، درک و پذیرش کامل قوانین و مقررات مندرج در این صفحه است.',
      'کارخودرو این حق را برای خود محفوظ می‌دارد که هر زمان، بدون اطلاع قبلی، این شرایط را تغییر دهد. استمرار استفاده از خدمات پس از تغییرات به منزله‌ی پذیرش شرایط جدید تلقی می‌شود.',
    ],
  },
  {
    title: '۲. تعریف خدمات',
    body: [
      'کارخودرو یک پلتفرم فروش آنلاین قطعات یدکی خودروهای ایرانی و خارجی است. خدمات ارائه‌شده شامل فروش قطعات اصل، مشاوره فنی و ارسال به سراسر کشور می‌شود.',
      'کارخودرو صرفاً واسطه‌ی فروش است و مسئولیت نصب، استفاده نادرست یا خسارات ناشی از عدم رعایت دستورالعمل‌های فنی را بر عهده ندارد.',
    ],
  },
  {
    title: '۳. ثبت‌نام و حساب کاربری',
    body: [
      'برای خرید، ثبت‌نام با شماره موبایل معتبر ایرانی الزامی است. شما مسئول حفظ محرمانگی اطلاعات ورود خود هستید.',
      'هرگونه فعالیت انجام‌شده از طریق حساب کاربری شما، حتی در صورت سوء استفاده‌ی دیگران، در قبال کارخودرو به عهده‌ی شماست. در صورت مشاهده‌ی دسترسی غیرمجاز، بلافاصله با پشتیبانی تماس بگیرید.',
      'کارخودرو حق دارد در صورت نقض قوانین، حساب کاربری را به صورت موقت یا دائم تعلیق کند.',
    ],
  },
  {
    title: '۴. سیاست قیمت‌گذاری و پرداخت',
    body: [
      'تمامی قیمت‌ها به تومان و شامل مالیات بر ارزش افزوده می‌باشند، مگر اینکه خلاف آن ذکر شده باشد.',
      'کارخودرو حق دارد قیمت‌ها را بدون اطلاع قبلی تغییر دهد. قیمت نهایی همان قیمتی است که در زمان تکمیل سفارش نمایش داده می‌شود.',
      'پرداخت‌ها از طریق درگاه‌های بانکی معتبر انجام می‌شود. اطلاعات کارت بانکی شما در هیچ مرحله‌ای در سرورهای کارخودرو ذخیره نمی‌شود.',
    ],
  },
  {
    title: '۵. ارسال و تحویل',
    body: [
      'کارخودرو تلاش می‌کند سفارشات را در کمترین زمان ممکن ارسال کند. زمان تحویل تقریبی است و تحت تأثیر شرایط جوی، تعطیلات رسمی و ظرفیت شرکت‌های حمل‌ونقل قرار دارد.',
      'ریسک از دست رفتن یا آسیب کالا در حین حمل‌ونقل به عهده‌ی شرکت پست یا پیک می‌باشد. کارخودرو بیمه‌ی مرسوله را توصیه می‌کند.',
      'در صورت عدم تحویل در زمان تعیین‌شده، با خدمات مشتریان تماس بگیرید.',
    ],
  },
  {
    title: '۶. بازگشت کالا و استرداد وجه',
    body: [
      'مشتریان تا ۷ روز پس از دریافت کالا حق بازگشت دارند، به شرطی که کالا دست‌نخورده، در بسته‌بندی اصلی و همراه فاکتور باشد.',
      'هزینه‌ی ارسال مجدد برای بازگشت کالای معیوب به عهده‌ی کارخودرو و برای پشیمانی خریدار به عهده‌ی مشتری است.',
      'استرداد وجه حداکثر تا ۵ روز کاری پس از دریافت و تأیید کالای برگشتی به حساب اعلامی واریز می‌شود.',
    ],
  },
  {
    title: '۷. ضمانت اصالت',
    body: [
      'کارخودرو ضمانت می‌دهد تمامی محصولات اصل و از منابع مجاز تأمین شده‌اند. در صورت اثبات تقلبی بودن کالا، هزینه‌ی کامل محصول بازپرداخت می‌شود.',
    ],
  },
  {
    title: '۸. حریم خصوصی',
    body: [
      'اطلاعات شخصی شما (نام، شماره تماس، آدرس) صرفاً برای پردازش سفارش و بهبود خدمات استفاده می‌شود و به هیچ شخص ثالثی فروخته نمی‌شود.',
      'کارخودرو ممکن است برای اطلاع‌رسانی تخفیف‌ها و اخبار جدید با شما تماس بگیرد. در هر زمان می‌توانید اشتراک پیامک را لغو کنید.',
    ],
  },
  {
    title: '۹. محدودیت مسئولیت',
    body: [
      'کارخودرو در قبال خسارات غیرمستقیم، از دست رفتن سود، یا خسارات ناشی از استفاده از وب‌سایت مسئولیتی ندارد.',
      'حداکثر مسئولیت کارخودرو در هر حال معادل مبلغ پرداخت‌شده توسط مشتری برای همان سفارش است.',
    ],
  },
  {
    title: '۱۰. قانون حاکم',
    body: [
      'این قرارداد تابع قوانین جمهوری اسلامی ایران است. هرگونه اختلاف از طریق مذاکره‌ی دوستانه حل‌وفصل می‌شود و در صورت عدم توافق، صالح به رسیدگی دادگاه‌های عمومی تهران می‌باشند.',
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8" aria-label="breadcrumb">
        <Link href="/" className="hover:text-accent-dark transition-colors">خانه</Link>
        <span>/</span>
        <span className="text-charcoal font-medium">قوانین و مقررات</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-charcoal mb-3">قوانین و مقررات</h1>
        <p className="text-sm text-gray-500 leading-6">
          آخرین به‌روزرسانی: ۱ خرداد ۱۴۰۵ — لطفاً پیش از استفاده از خدمات کارخودرو این صفحه را با دقت مطالعه کنید.
        </p>
        <div className="mt-4 h-1 w-16 bg-accent rounded-full" />
      </div>

      {/* Intro */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 mb-8 text-sm text-amber-900 leading-7">
        خوش‌آمدید به <strong>کارخودرو</strong> — بزرگ‌ترین فروشگاه آنلاین قطعات یدکی ایران. استفاده از
        هرگونه خدمات ما مستلزم پذیرش کامل شرایط زیر است. در صورت عدم توافق با هر بخشی، لطفاً از
        استفاده از خدمات خودداری کنید.
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-bold text-charcoal mb-3 flex items-center gap-2">
              <span className="inline-block w-1 h-5 bg-accent rounded-full shrink-0" />
              {section.title}
            </h2>
            <div className="space-y-3 text-sm text-gray-600 leading-7 border-r-2 border-gray-100 pr-4">
              {section.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 bg-charcoal text-white rounded-2xl px-6 py-6 text-sm leading-7">
        <p className="font-bold mb-2">تماس با ما</p>
        <p className="text-gray-300">
          در صورت داشتن هرگونه سؤال درباره‌ی این قوانین، می‌توانید از طریق{' '}
          <span className="text-accent font-semibold">۰۲۱-۸۸۱۲۳۴۵۶</span> یا ایمیل{' '}
          <span className="text-accent font-semibold" dir="ltr">support@carkhodro.ir</span>{' '}
          با تیم پشتیبانی ما در تماس باشید.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="bg-accent hover:bg-accent-dark text-charcoal font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          ورود / ثبت‌نام
        </Link>
        <Link
          href="/"
          className="border-2 border-silver hover:border-accent text-charcoal font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
