/**
 * Persian display labels for order/payment enums. Shared so the dashboard,
 * receipt page and the printable receipt all render the same wording.
 */

import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/generated/prisma_client';

export const ORDER_STATUS_FA: Record<OrderStatus, string> = {
  NEW: 'سفارش جدید',
  AWAITING_CONFIRMATION: 'در انتظار تایید',
  CONFIRMED_AWAITING_PAYMENT: 'تایید شده و در انتظار پرداخت',
  PAID: 'پرداخت شده توسط مشتری',
  SHIPPED: 'ارسال سفارش',
  COMPLETED: 'اتمام فاکتور',
  CANCELLED_BY_CUSTOMER: 'لغو شده توسط مشتری',
  CANCELLED_BY_MANAGER: 'لغو توسط مدیرفروشگاه',
  ARCHIVED: 'آرشیو',
};

/**
 * Tailwind colour classes per status for the dashboard badges. Greens for the
 * happy path, ambers for the in-progress states, reds for cancellations and a
 * neutral grey for the archive.
 */
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  NEW: 'bg-blue-50 text-blue-600 border-blue-200',
  AWAITING_CONFIRMATION: 'bg-amber-50 text-amber-600 border-amber-200',
  CONFIRMED_AWAITING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  SHIPPED: 'bg-teal-50 text-teal-600 border-teal-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED_BY_CUSTOMER: 'bg-red-50 text-red-500 border-red-200',
  CANCELLED_BY_MANAGER: 'bg-red-50 text-red-600 border-red-200',
  ARCHIVED: 'bg-gray-100 text-gray-500 border-gray-200',
};

/**
 * The statuses an order can move through, in lifecycle order — used to populate
 * the orders-list filter dropdown.
 */
export const ORDER_STATUS_ORDER: OrderStatus[] = [
  'NEW',
  'AWAITING_CONFIRMATION',
  'CONFIRMED_AWAITING_PAYMENT',
  'PAID',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_MANAGER',
  'ARCHIVED',
];

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
