/**
 * Normalize Iranian mobile numbers to `09XXXXXXXXX` (site auth format).
 * Returns null when the value is missing or not a usable mobile.
 */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toAsciiDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (p >= 0) return String(p);
    const a = ARABIC_DIGITS.indexOf(ch);
    if (a >= 0) return String(a);
    return ch;
  });
}

/** Return `09XXXXXXXXX` or null if the contact has no usable mobile. */
export function normalizeIranMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = toAsciiDigits(raw).trim();
  s = s.replace(/[\s\-()]/g, '');
  if (s.startsWith('+98')) s = `0${s.slice(3)}`;
  else if (s.startsWith('0098')) s = `0${s.slice(4)}`;
  else if (s.startsWith('98') && s.length === 12) s = `0${s.slice(2)}`;
  else if (s.startsWith('9') && s.length === 10) s = `0${s}`;
  if (!/^09\d{9}$/.test(s)) return null;
  return s;
}
