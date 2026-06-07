'use client';

import { useState } from 'react';
import Link from 'next/link';

const FAQ_ITEMS = [
  {
    q: 'چگونه از اصالت قطعات مطمئن شوم؟',
    a: 'تمامی محصولات کارخودرو دارای ضمانت اصالت کالا هستند و از منابع معتبر و رسمی تأمین می‌شوند. کد پیگیری ضمانت روی بسته‌بندی هر محصول درج شده است.',
  },
  {
    q: 'مدت زمان ارسال چقدر است؟',
    a: 'سفارشات تهران معمولاً ۲۴ ساعته و سایر شهرها ظرف ۴۸ تا ۷۲ ساعت کاری ارسال می‌شوند. پس از ثبت سفارش، کد رهگیری پستی از طریق پیامک ارسال می‌گردد.',
  },
  {
    q: 'آیا امکان مرجوع کردن کالا وجود دارد؟',
    a: 'بله. تا ۷ روز پس از دریافت کالا، در صورت عدم استفاده و سالم بودن بسته‌بندی، امکان مرجوع و بازگشت وجه وجود دارد.',
  },
  {
    q: 'چه روش‌های پرداختی پذیرفته می‌شود؟',
    a: 'پرداخت آنلاین از طریق درگاه بانکی، پرداخت در محل (کارت‌خوان) و پرداخت کارت به کارت برای سفارش‌های خاص امکان‌پذیر است.',
  },
  {
    q: 'چطور قطعه مناسب خودرو خود را پیدا کنم؟',
    a: 'از فیلتر جستجو بر اساس مدل خودرو در صفحه محصولات استفاده کنید. همچنین می‌توانید از طریق شماره تلفن پشتیبانی با کارشناسان فنی ما مشورت نمایید.',
  },
  {
    q: 'آیا برای محصولات گارانتی وجود دارد؟',
    a: 'اکثر محصولات دارای گارانتی برند سازنده هستند. مدت گارانتی روی صفحه هر محصول قید شده است.',
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">سوالات متداول</span>
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-charcoal mb-8 text-center">سوالات متداول</h1>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-right font-semibold text-charcoal hover:text-accent-dark transition-colors"
              >
                <span>{item.q}</span>
                <svg
                  className={`w-5 h-5 text-accent flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-gray-600 leading-8 border-t border-gray-100 pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-gray-600 mb-4">پاسخ سوالتان را نیافتید؟</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
            تماس با پشتیبانی
          </Link>
        </div>
      </div>
    </div>
  );
}
