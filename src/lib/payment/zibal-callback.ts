/**
 * Zibal callback handler — verify payment and update the order.
 * Called from the GET /api/payment/zibal/callback route after the user returns
 * from the bank gateway.
 */

import { prisma } from '@/src/lib/prisma';
import { RIAL_PER_TOMAN } from '@/src/lib/format';
import { clearUserCart } from '@/src/lib/clear-user-cart';
import { zibalVerifyPayment } from '@/src/lib/zibal/client';
import { zibalStatusMessage } from '@/src/lib/zibal/status-messages';
import {
  ZIBAL_RESULT_ALREADY_VERIFIED,
  ZIBAL_RESULT_OK,
  type ZibalCallbackParams,
} from '@/src/lib/zibal/types';

export interface ZibalCallbackOutcome {
  redirectPath: string;
}

function buildFailedRedirect(orderId: string | null, reason: string): ZibalCallbackOutcome {
  const params = new URLSearchParams();
  if (orderId) params.set('order', orderId);
  params.set('reason', reason);
  return { redirectPath: `/payment/failed?${params.toString()}` };
}

function buildSuccessRedirect(orderId: string): ZibalCallbackOutcome {
  return { redirectPath: `/payment/success?order=${orderId}` };
}

/** Restore stock and mark an unpaid online order as failed/cancelled. */
async function failUnpaidOrder(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.paymentStatus !== 'PENDING') return;

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          saleCount: { decrement: item.quantity },
        },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED_BY_CUSTOMER',
      },
    });
  });
}

/** Mark order as paid after a successful Zibal verify. Idempotent when already PAID. */
async function confirmPaidOrder(
  orderId: string,
  trackId: bigint,
  refNumber?: number,
): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (order.paymentStatus === 'PAID') return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      status: 'PAID',
      paidAt: new Date(),
      paymentTrackId: trackId,
      paymentRefNumber: refNumber != null ? String(refNumber) : null,
    },
  });
  await clearUserCart(order.userId);
}

/**
 * Process Zibal's GET callback query string, verify when appropriate, and return
 * the in-app path to redirect the user to.
 */
export async function handleZibalCallback(
  params: ZibalCallbackParams,
): Promise<ZibalCallbackOutcome> {
  const { success, trackId: trackIdRaw, orderId, status: statusRaw } = params;

  if (!orderId || !trackIdRaw) {
    return buildFailedRedirect(
      orderId,
      'اطلاعات بازگشتی از درگاه پرداخت ناقص است.',
    );
  }

  const trackId = BigInt(trackIdRaw);
  const statusCode = statusRaw != null ? Number(statusRaw) : null;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return buildFailedRedirect(orderId, 'سفارش یافت نشد.');
  }
  if (order.paymentMethod !== 'ONLINE') {
    return buildFailedRedirect(orderId, 'این سفارش پرداخت آنلاین نیست.');
  }
  if (order.paymentTrackId != null && order.paymentTrackId !== trackId) {
    return buildFailedRedirect(orderId, 'شناسه پرداخت با سفارش مطابقت ندارد.');
  }

  // Already completed — send user to success (e.g. double callback / refresh).
  if (order.paymentStatus === 'PAID') {
    return buildSuccessRedirect(orderId);
  }

  if (success !== '1') {
    await failUnpaidOrder(orderId);
    return buildFailedRedirect(orderId, zibalStatusMessage(statusCode));
  }

  let verify;
  try {
    verify = await zibalVerifyPayment(Number(trackId));
  } catch (err) {
    console.error('[zibal:callback] verify failed', err);
    return buildFailedRedirect(orderId, 'تایید پرداخت با خطا مواجه شد. لطفاً با پشتیبانی تماس بگیرید.');
  }

  const verifyOk =
    verify.result === ZIBAL_RESULT_OK || verify.result === ZIBAL_RESULT_ALREADY_VERIFIED;

  if (!verifyOk) {
    await failUnpaidOrder(orderId);
    return buildFailedRedirect(
      orderId,
      verify.message || zibalStatusMessage(verify.status ?? statusCode),
    );
  }

  const expectedRial = Number(order.totalAmount) * RIAL_PER_TOMAN;
  if (verify.amount != null && verify.amount !== expectedRial) {
    console.error('[zibal:callback] amount mismatch', {
      orderId,
      expectedRial,
      received: verify.amount,
    });
    await failUnpaidOrder(orderId);
    return buildFailedRedirect(orderId, 'مبلغ پرداخت با سفارش مطابقت ندارد.');
  }

  if (verify.orderId && verify.orderId !== orderId) {
    await failUnpaidOrder(orderId);
    return buildFailedRedirect(orderId, 'شناسه سفارش با درگاه مطابقت ندارد.');
  }

  await confirmPaidOrder(orderId, trackId, verify.refNumber);
  return buildSuccessRedirect(orderId);
}
