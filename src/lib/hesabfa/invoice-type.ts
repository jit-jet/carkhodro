/** Hesabfa's documented InvoiceType codes. */
export const INVOICE_TYPES = [0, 1, 2, 3] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export function isInvoiceType(value: unknown): value is InvoiceType {
  return typeof value === 'number' && INVOICE_TYPES.includes(value as InvoiceType);
}

export function invoiceTypeLabel(type: number): string {
  switch (type) {
    case 0: return 'فروش';
    case 1: return 'خرید';
    case 2: return 'برگشت از فروش';
    case 3: return 'برگشت از خرید';
    default: return 'نامشخص';
  }
}

export function orderSourceTypeLabel(source: 'ONLINE' | 'OFFLINE', type: number): string {
  return `فاکتور ${invoiceTypeLabel(type)} ثبت شده در ${source === 'OFFLINE' ? 'حسابداری' : 'سایت'}`;
}
