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
    `همکار گرامی، سفارش شما با شماره فاکتور ${invoiceNumber} توسط مدیریت تأیید شد.`,
    'برای مشاهده جزئیات و ادامه فرایند، به پنل همکاری مراجعه کنید.',
    'carkhodro.com',
  ].join('\n');
}

export function wholesaleInvoiceSubmittedMessage(invoiceNumber: string): string {
  return [
    'کارخودرو',
    `همکار گرامی، سفارش شما با شماره فاکتور ${invoiceNumber} با موفقیت ثبت شد.`,
    'سفارش در انتظار بررسی و تأیید مدیریت است.',
    'پس از تأیید، نتیجه از طریق پیامک به شما اطلاع داده می‌شود.',
    'carkhodro.com',
  ].join('\n');
}

export function retailPurchasePaidMessage(orderNumber: number): string {
  return [
    'کارخودرو',
    `مشتری گرامی، سفارش شما با شماره ${orderNumber} با موفقیت پرداخت و ثبت شد.`,
    'سفارش شما در حال بررسی و آماده‌سازی است.',
    'carkhodro.com',
  ].join('\n');
}
