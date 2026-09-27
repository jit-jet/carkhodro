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
  return [
    'کارخودرو',
    `همکار گرامی، فاکتور ${invoiceNumber} شما تأیید شد.`,
  ].join('\n');
}

export function wholesaleInvoiceSubmittedMessage(invoiceNumber: string): string {
  return [
    'کارخودرو',
    '',
    `همکار گرامی،سفارش شما با شماره فاکتور ${invoiceNumber} با موفقیت ثبت شد.`,
  ].join('\n');
}

export function retailPurchasePaidMessage(orderNumber: number): string {
  return [
    'کارخودرو',
    `سفارش شما با شماره فاکتور ${orderNumber} با موفقیت پرداخت و ثبت شد.`,
  ].join('\n');
}
