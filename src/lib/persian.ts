/**
 * Mirror of the SQL `fts_normalize()` (see add_product_fuzzy_search migration):
 * unify Arabic/Persian Yeh + Kaf, fold Arabic/Persian digits to Latin, strip
 * ZWNJ + tatweel, lowercase and collapse whitespace. Keeping the two in sync is
 * what lets app-side text line up with whatever the DB normalized.
 */
export function toEnglishDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

export function normalizePersianText(input: string): string {
  return toEnglishDigits(input)
    .toLowerCase()
    .replace(/ي/g, 'ی') // ي → ی
    .replace(/ك/g, 'ک') // ك → ک
    .replace(/[‌ـ]/g, '') // ZWNJ, tatweel
    .replace(/\s+/g, ' ')
    .trim();
}
