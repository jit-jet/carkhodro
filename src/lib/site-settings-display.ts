/** Split multiline site-setting text into display lines. */
export function settingLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Build a `tel:` href from a display phone string (handles Persian/Arabic digits). */
export function phoneTelHref(phone: string): string {
  const normalized = phone.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d))).replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
  const digits = normalized.replace(/\D/g, '');
  return digits ? `tel:${digits}` : '#';
}
