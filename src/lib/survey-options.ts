/**
 * Fixed option lists for the post-purchase order survey («نظر سنجی»).
 * ────────────────────────────────────────────────────────────────────
 * The survey stores the selected option *keys* (not the Persian labels) in
 * `order_surveys.positive_points` / `negative_points`, so wording can be tweaked
 * here without rewriting stored rows. The exact phrasing mirrors the reference
 * design. `labelForPoint` resolves a stored key back to its label for display.
 */

export interface SurveyOption {
  key: string;
  label: string;
}

/** «نکات مثبت» — things that went well. */
export const POSITIVE_POINTS: SurveyOption[] = [
  { key: 'stock-reliability', label: 'قابلیت اطمینان موجودی کالاها' },
  { key: 'technical-info-access', label: 'دسترسی آسان به اطلاعات فنی و شماره‌فنی قطعات' },
  { key: 'fast-sales-support', label: 'پشتیبانی سریع و پاسخگویی مناسب واحد فروش' },
  { key: 'fast-fulfilment', label: 'سرعت تأمین و ارسال سفارش‌ها' },
  { key: 'fair-wholesale-pricing', label: 'قیمت‌گذاری منصفانه و رقابتی برای فروش عمده' },
  { key: 'brand-availability', label: 'ثبات تأمین برندها و قطعات خاص مورد نیاز' },
  { key: 'careful-packaging', label: 'سلامت و دقت در بسته‌بندی کالاها' },
  { key: 'transparent-invoicing', label: 'شفافیت در محاسبه فاکتور و تخفیف‌ها' },
  { key: 'overall-satisfaction', label: 'تجربه کلی رضایت‌بخش از همکاری و تعامل کاری' },
];

/** «نکات منفی» — things to improve. */
export const NEGATIVE_POINTS: SurveyOption[] = [
  { key: 'shipping-delay', label: 'تاخیر در ارسال یا کمبود موجودی ناگهانی' },
  { key: 'weak-technical-support', label: 'پشتیبانی فنی ناکافی در انتخاب قطعات خاص' },
  { key: 'loyal-partner-neglect', label: 'عدم توجه کافی به فروشندگان وفادار یا عمده‌فروشان بزرگ' },
  { key: 'wrong-delivery', label: 'اشتباه در تحویل کالا از نظر کد یا تعداد' },
  { key: 'price-volatility', label: 'نوسان زیاد قیمت‌ها یا عدم ثبات تخفیف عمده' },
  { key: 'return-warranty-issues', label: 'مشکلات در فرایند مرجوعی یا گارانتی' },
  { key: 'site-panel-issues', label: 'مشکل در کار با سایت یا پنل سفارش آنلاین' },
];

const LABELS = new Map<string, string>(
  [...POSITIVE_POINTS, ...NEGATIVE_POINTS].map((o) => [o.key, o.label]),
);

const POSITIVE_KEYS = new Set(POSITIVE_POINTS.map((o) => o.key));
const NEGATIVE_KEYS = new Set(NEGATIVE_POINTS.map((o) => o.key));

/** Resolve a stored point key to its Persian label (falls back to the key). */
export function labelForPoint(key: string): string {
  return LABELS.get(key) ?? key;
}

/** Keep only recognised positive keys (defensive against forged form input). */
export function sanitizePositivePoints(keys: string[]): string[] {
  return keys.filter((k) => POSITIVE_KEYS.has(k));
}

/** Keep only recognised negative keys. */
export function sanitizeNegativePoints(keys: string[]): string[] {
  return keys.filter((k) => NEGATIVE_KEYS.has(k));
}
