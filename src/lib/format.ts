/**
 * Display formatting helpers for the partner dashboard.
 * ─────────────────────────────────────────────────────
 * Money: product prices are stored in the same magnitude the rest of the app
 * renders as **Toman** (see `src/lib/serializers.ts`). The wholesale invoice UI
 * shows figures in **Rial** (Toman × 10) plus the payable amount spelled out in
 * Toman words — so these helpers all take a Toman amount and convert as needed.
 *
 * Dates: `Intl` with the `fa-IR` locale renders the Jalali (Persian) calendar
 * with Persian digits out of the box, so every Jalali helper delegates to it.
 */

/** 1 Toman = 10 Rial. */
export const RIAL_PER_TOMAN = 10;

// ── Money ─────────────────────────────────────────────────────────────────────

/** Group a number with Persian digits and thousands separators (no unit). */
export function formatNumberFa(n: number): string {
  return Math.round(n).toLocaleString('fa-IR');
}

export function noFormatNumberFa(n: number): string {
  return Math.round(n).toLocaleString('fa-IR',{useGrouping: false,});
}

/** A Toman amount rendered in Rial, e.g. `«۸٬۳۰۰٬۰۰۰ ریال»`. */
export function formatRial(toman: number): string {
  return `${formatNumberFa(toman * RIAL_PER_TOMAN)} ریال`;
}

/** A Toman amount rendered in Toman, e.g. `«۸۳۰٬۰۰۰ تومان»`. */
export function formatToman(toman: number): string {
  return `${formatNumberFa(toman)} تومان`;
}

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = [
  'ده', 'یازده', 'دوازده', 'سیزده', 'چهارده',
  'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده',
];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = [
  '', 'صد', 'دویست', 'سیصد', 'چهارصد',
  'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد',
];
/** Scale words for each 3-digit group; index 0 is the units group. */
const SCALES = ['', ' هزار', ' میلیون', ' میلیارد', ' هزار میلیارد', ' میلیون میلیارد'];

/** Spell a 0–999 group in Persian, joined with « و ». */
function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) parts.push(HUNDREDS[hundreds]);
  if (rest >= 20) {
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    parts.push(ones > 0 ? `${TENS[tens]} و ${ONES[ones]}` : TENS[tens]);
  } else if (rest >= 10) {
    parts.push(TEENS[rest - 10]);
  } else if (rest > 0) {
    parts.push(ONES[rest]);
  }
  return parts.join(' و ');
}

/**
 * Spell a non-negative integer out in Persian words (no unit). Handles values up
 * to 10¹⁸ − 1, far beyond any realistic price. Returns «صفر» for zero.
 */
export function numberToPersianWords(value: number): string {
  let n = Math.floor(Math.abs(value));
  if (n === 0) return 'صفر';

  const groups: number[] = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    parts.push(threeDigitsToWords(groups[i]) + (SCALES[i] ?? ''));
  }
  return parts.join(' و ');
}

/** A Toman amount spelled out, e.g. `«هشتصد و سی هزار تومان»`. */
export function tomanInWords(toman: number): string {
  return `${numberToPersianWords(toman)} تومان`;
}

// ── Jalali dates ──────────────────────────────────────────────────────────────

function asDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/** `«۲۷ خرداد ۱۴۰۵»` */
export function formatJalaliDate(value: Date | string | number): string {
  return asDate(value).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** `«شنبه ۱۶ خرداد ۱۴۰۵»` */
export function formatJalaliWithWeekday(value: Date | string | number): string {
  return asDate(value).toLocaleDateString('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** `«۱۷:۳۸»` */
export function formatTimeFa(value: Date | string | number): string {
  return asDate(value).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** `«۲۷ خرداد ۱۴۰۵ - ۱۷:۳۸»` */
export function formatJalaliDateTime(value: Date | string | number): string {
  return `${formatJalaliDate(value)} - ${formatTimeFa(value)}`;
}
