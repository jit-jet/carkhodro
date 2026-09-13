/**
 * Normalize Iranian mobile numbers to `09XXXXXXXXX` (site auth format).
 * Returns null when the value is missing or not a usable mobile.
 */

import type { HesabfaContact } from './types';

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

/** Hesabfa's Phone is a mobile source only when Mobile is absent. */
export function contactPrimaryMobile(contact: Pick<HesabfaContact, 'Mobile' | 'Phone'>): string | null {
  return contact.Mobile?.trim()
    ? normalizeIranMobile(contact.Mobile)
    : normalizeIranMobile(contact.Phone);
}

/** Common spellings used by Hesabfa's exact-value contact filters. */
export function mobileLookupVariants(mobile: string, raw?: string | null): string[] {
  const local = mobile.slice(1);
  return [raw?.trim() ?? '', mobile, local, `98${local}`, `+98${local}`, `0098${local}`];
}
