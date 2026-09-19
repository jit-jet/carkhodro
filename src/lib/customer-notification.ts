import 'server-only';

import { after } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { normalizeIranMobile } from '@/src/lib/hesabfa/phone';
import { sendSms } from '@/src/lib/sms-gateway';
import { WHOLESALE_APPROVED_STATUSES } from '@/src/lib/order-labels';
import {
  retailPurchasePaidMessage,
  wholesaleActivationMessage,
  wholesaleInvoiceApprovedMessage,
} from '@/src/lib/customer-notification-message';

export type CustomerNotificationKind =
  | 'WHOLESALE_ACTIVATED'
  | 'WHOLESALE_INVOICE_APPROVED'
  | 'RETAIL_PURCHASE_PAID';

async function sendCustomerNotification(kind: CustomerNotificationKind, id: string): Promise<void> {
  let phoneNumber: string | null = null;
  let body: string | null = null;

  if (kind === 'WHOLESALE_ACTIVATED') {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true, phoneNumber: true },
    });
    if (user?.role !== 'WHOLESALE') return;
    phoneNumber = normalizeIranMobile(user.phoneNumber);
    body = wholesaleActivationMessage();
  } else {
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        paymentStatus: true,
        hesabfaCode: true,
        orderNumber: true,
        user: { select: { role: true, phoneNumber: true } },
      },
    });
    if (!order) return;
    phoneNumber = normalizeIranMobile(order.user.phoneNumber);

    if (kind === 'WHOLESALE_INVOICE_APPROVED') {
      if (order.user.role !== 'WHOLESALE' || !WHOLESALE_APPROVED_STATUSES.includes(order.status)) return;
      body = wholesaleInvoiceApprovedMessage(order.hesabfaCode ?? String(order.orderNumber));
    } else {
      if (order.user.role !== 'RETAIL' || order.paymentStatus !== 'PAID') return;
      body = retailPurchasePaidMessage(order.orderNumber);
    }
  }

  if (!phoneNumber || !body) return;
  const result = await sendSms(phoneNumber, body);
  if (!result.ok) console.error('[customer-notification] SMS delivery failed', { kind, id });
}

/** Send a best-effort transactional SMS after the current response. */
export function queueCustomerNotification(kind: CustomerNotificationKind, id: string): void {
  after(async () => {
    try {
      await sendCustomerNotification(kind, id);
    } catch (error) {
      console.error('[customer-notification] unexpected failure', { kind, id, error });
    }
  });
}
