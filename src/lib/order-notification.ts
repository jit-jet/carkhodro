import 'server-only';

import { after } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { sendSms } from '@/src/lib/sms-gateway';
import {
  buildAdminInvoiceUrl,
  buildAdminOrderNotificationMessage,
  type AdminOrderNotificationKind,
} from '@/src/lib/order-notification-message';

async function sendAdminOrderNotification(
  orderId: string,
  kind: AdminOrderNotificationKind,
): Promise<void> {
  const settings = await prisma.siteSetting.findUnique({
    where: { id: 1 },
    select: { adminSmsNotificationPhone: true },
  });
  const phoneNumber = settings?.adminSmsNotificationPhone?.trim();
  if (!phoneNumber) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      totalAmount: true,
      user: {
        select: { firstName: true, lastName: true, role: true },
      },
    },
  });
  if (!order) return;

  const expectedRole = kind === 'RETAIL_PAYMENT' ? 'RETAIL' : 'WHOLESALE';
  if (order.user.role !== expectedRole) return;

  const buyerFullName = `${order.user.firstName} ${order.user.lastName}`
    .replace(/\s+/g, ' ')
    .trim();
  const invoiceUrl = buildAdminInvoiceUrl(
    process.env.NEXT_PUBLIC_APP_URL ?? '',
    orderId,
  );
  const body = buildAdminOrderNotificationMessage({
    kind,
    buyerFullName,
    amountToman: order.totalAmount,
    invoiceUrl,
  });
  const result = await sendSms(phoneNumber, body);
  if (!result.ok) {
    console.error('[order-notification] SMS delivery failed', { orderId, kind });
  }
}

/** Queue a best-effort admin SMS after the current response has completed. */
export function queueAdminOrderNotification(
  orderId: string,
  kind: AdminOrderNotificationKind,
): void {
  after(async () => {
    try {
      await sendAdminOrderNotification(orderId, kind);
    } catch (error) {
      console.error('[order-notification] unexpected failure', { orderId, kind, error });
    }
  });
}
