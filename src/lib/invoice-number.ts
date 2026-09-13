/** Preserve Hesabfa's invoice Number as text, including any leading zeroes. */
export function formatInvoiceNumber(number: string | null): string {
  if (!number?.trim()) return 'در انتظار صدور';
  return number.trim().replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

/** Accept Persian and Arabic digits when searching for a Hesabfa invoice. */
export function normalizeInvoiceNumber(value: string): string {
  return value.trim().replace(/[۰-۹٠-٩]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x6f0 ? code - 0x6f0 : code - 0x660);
  });
}
