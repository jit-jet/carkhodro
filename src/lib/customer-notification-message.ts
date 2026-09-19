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
  return 'کارخودرو: حساب شما همکار شد. از این پس قیمت همکاری را می‌بینید.';
}

export function wholesaleInvoiceApprovedMessage(invoiceNumber: string): string {
  return `کارخودرو: فاکتور ${invoiceNumber} شما تأیید شد. جزئیات در پنل همکار.`;
}

export function retailPurchasePaidMessage(orderNumber: number): string {
  return `کارخودرو: خرید ${orderNumber} با موفقیت پرداخت و ثبت شد.`;
}
