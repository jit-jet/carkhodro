/**
 * Mirror of the SQL `fts_normalize()` (see the product_fuzzy_search migration):
 * unify Arabic/Persian Yeh + Kaf, fold Arabic/Persian digits to Latin, strip
 * ZWNJ + tatweel, lowercase and collapse whitespace. Keeping the two in sync is
 * what lets app-side text line up with whatever the DB normalized.
 */
export function normalizePersianText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)) // ٠-٩
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)) // ۰-۹
    .replace(/ي/g, 'ی') // ي → ی
    .replace(/ك/g, 'ک') // ك → ک
    .replace(/[‌ـ]/g, '') // ZWNJ, tatweel
    .replace(/\s+/g, ' ')
    .trim();
}
