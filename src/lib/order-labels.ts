/**
 * Persian display labels for order/payment enums. Shared so the dashboard,
 * receipt page and the printable receipt all render the same wording.
 */

import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/generated/prisma_client';

export const ORDER_STATUS_FA: Record<OrderStatus, string> = {
  PENDING: 'در انتظار پرداخت',
  CONFIRMED: 'تأیید شده',
  PROCESSING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو شده',
  REFUNDED: 'مرجوع شده',
};

export const PAYMENT_STATUS_FA: Record<PaymentStatus, string> = {
  PENDING: 'در انتظار پرداخت',
  PAID: 'پرداخت شده',
  FAILED: 'ناموفق',
  REFUNDED: 'مرجوع شده',
};

export const PAYMENT_METHOD_FA: Record<PaymentMethod, string> = {
  ONLINE: 'پرداخت آنلاین',
  COD: 'پرداخت در محل',
};
