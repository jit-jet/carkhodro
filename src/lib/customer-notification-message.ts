import type { OrderStatus, UserRole } from '@/generated/prisma_client';

export function isWholesaleApprovalTransition(
  role: UserRole,
  previous: OrderStatus,
  next: OrderStatus,
): boolean {
  return role === 'WHOLESALE'
    && (previous === 'NEW' || previous === 'AWAITING_CONFIRMATION')
    && next === 'CONFIRMED_AWAITING_PAYMENT';
}

export function wholesaleActivationMessage(): string {
  return [
    'کاربر گرامی کارخودرو',
    'حساب کاربری شما به «همکار» تغییر یافت.',
    'از این پس می‌توانید از قیمت‌ها و امکانات همکاری استفاده کنید.',
    'carkhodro.com',
  ].join('\n');
}

export function wholesaleInvoiceApprovedMessage(invoiceNumber: string): string {
  return `کارخودرو: فاکتور ${invoiceNumber} شما تأیید شد. جزئیات در پنل همکار.`;
}

export function retailPurchasePaidMessage(orderNumber: number): string {
  return `کارخودرو: خرید ${orderNumber} با موفقیت پرداخت و ثبت شد.`;
}
