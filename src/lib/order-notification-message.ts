import { toEnglishDigits } from './persian';

export type AdminOrderNotificationKind = 'RETAIL_PAYMENT' | 'WHOLESALE_INVOICE';

export interface AdminOrderNotificationMessageInput {
  kind: AdminOrderNotificationKind;
  buyerFullName: string;
  amountToman: bigint;
  invoiceUrl: string;
}

export function buildAdminInvoiceUrl(appUrl: string, orderId: string): string {
  const baseUrl = toEnglishDigits(appUrl.trim().replace(/\/$/, ''));
  if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL is required for order notifications.');
  const asciiOrderId = toEnglishDigits(orderId);
  return toEnglishDigits(
    new URL('/admin/orders/' + encodeURIComponent(asciiOrderId), baseUrl + '/').toString(),
  );
}

export function buildAdminOrderNotificationMessage(
  input: AdminOrderNotificationMessageInput,
): string {
  const title = input.kind === 'RETAIL_PAYMENT'
    ? 'پرداخت آنلاین جدید'
    : 'فاکتور همکاری جدید';

  return [
    title,
    `خریدار: ${input.buyerFullName}`,
    `مبلغ: ${input.amountToman.toLocaleString('fa-IR')} تومان`,
    'مشاهده سفارش:',
    toEnglishDigits(input.invoiceUrl),
  ].join('\n');
}
