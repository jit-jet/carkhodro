export type AdminOrderNotificationKind = 'RETAIL_PAYMENT' | 'WHOLESALE_INVOICE';

export interface AdminOrderNotificationMessageInput {
  kind: AdminOrderNotificationKind;
  buyerFullName: string;
  amountToman: bigint;
  invoiceUrl: string;
}

export function buildAdminInvoiceUrl(appUrl: string, orderId: string): string {
  const baseUrl = appUrl.trim().replace(/\/$/, '');
  if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL is required for order notifications.');
  return new URL(`/admin/orders/${encodeURIComponent(orderId)}`, `${baseUrl}/`).toString();
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
    input.invoiceUrl,
  ].join('\n');
}
