export const MANAGED_STATIC_PAGES = [
  { path: '/about', label: 'درباره ما', title: 'درباره کارخودرو', description: 'درباره فروشگاه آنلاین قطعات یدکی کارخودرو' },
  { path: '/contact', label: 'تماس با ما', title: 'تماس با ما | کارخودرو', description: 'راه‌های ارتباط با فروشگاه کارخودرو' },
  { path: '/faq', label: 'سوالات متداول', title: 'سوالات متداول | کارخودرو', description: 'پاسخ سوالات رایج درباره خرید قطعه خودرو، ارسال و مرجوعی.' },
  { path: '/rules', label: 'قوانین و مقررات', title: 'قوانین و مقررات | کارخودرو', description: 'قوانین و شرایط استفاده از خدمات فروشگاه آنلاین کارخودرو' },
  { path: '/return', label: 'شرایط مرجوعی', title: 'شرایط مرجوعی | کارخودرو', description: 'شرایط و ضوابط مرجوع کردن کالا در کارخودرو' },
  { path: '/blog', label: 'وبلاگ', title: 'وبلاگ کارخودرو', description: 'راهنماها، نکات فنی و اخبار دنیای خودرو' },
  { path: '/products', label: 'فهرست محصولات', title: 'محصولات | کارخودرو', description: 'فهرست قطعات یدکی خودرو در فروشگاه کارخودرو' },
] as const;

export type ManagedStaticPagePath = (typeof MANAGED_STATIC_PAGES)[number]['path'];

export function isManagedStaticPage(path: string): path is ManagedStaticPagePath {
  return MANAGED_STATIC_PAGES.some((page) => page.path === path);
}
