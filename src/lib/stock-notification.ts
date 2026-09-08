import 'server-only';

import { prisma } from '@/src/lib/prisma';
import { sendBulkSms } from '@/src/lib/sms-gateway';
import { buildStockNotificationMessage } from '@/src/lib/stock-notification-message';
import { siteUrl } from '@/src/lib/seo';

const STALE_CLAIM_MS = 15 * 60 * 1000;

export interface StockNotificationDispatchStats {
  claimed: number;
  sent: number;
  failed: number;
}

/**
 * Deliver pending notifications for products that are currently available.
 *
 * A short-lived database claim prevents overlapping Hesabfa syncs from sending
 * the same SMS twice. Failed (or abandoned) claims remain retryable.
 */
export async function dispatchStockNotificationsForProducts(
  productIds: readonly string[],
): Promise<StockNotificationDispatchStats> {
  const ids = [...new Set(productIds.filter(Boolean))];
  const stats: StockNotificationDispatchStats = { claimed: 0, sent: 0, failed: 0 };
  if (ids.length === 0) return stats;

  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);

  try {
    const pending = await prisma.stockNotification.findMany({
      where: {
        productId: { in: ids },
        sentAt: null,
        OR: [{ processingAt: null }, { processingAt: { lt: staleBefore } }],
        product: { isActive: true, stock: { gt: 0 } },
      },
      select: {
        id: true,
        productId: true,
        phoneNumber: true,
        product: { select: { name: true } },
      },
    });

    const claimedByProduct = new Map<string, typeof pending>();
    for (const notification of pending) {
      const claimed = await prisma.stockNotification.updateMany({
        where: {
          id: notification.id,
          sentAt: null,
          OR: [{ processingAt: null }, { processingAt: { lt: staleBefore } }],
        },
        data: {
          processingAt: now,
          attemptCount: { increment: 1 },
          lastError: null,
        },
      });
      if (claimed.count !== 1) continue;

      stats.claimed++;
      const group = claimedByProduct.get(notification.productId) ?? [];
      group.push(notification);
      claimedByProduct.set(notification.productId, group);
    }

    for (const notifications of claimedByProduct.values()) {
      const product = notifications[0]!.product;
      const body = buildStockNotificationMessage({
        productName: product.name,
        productUrl: siteUrl(
          '/products/' + encodeURIComponent(notifications[0]!.productId),
        ),
      });

      let results;
      try {
        results = await sendBulkSms(
          notifications.map((notification) => notification.phoneNumber),
          body,
        );
      } catch (error) {
        console.error('[stock-notification:sms]', error);
        results = notifications.map((notification) => ({
          phoneNumber: notification.phoneNumber,
          ok: false,
        }));
      }

      const deliveredByPhone = new Map(
        results.map((result) => [result.phoneNumber, result.ok]),
      );

      await Promise.all(
        notifications.map(async (notification) => {
          const delivered = deliveredByPhone.get(notification.phoneNumber) === true;
          if (delivered) {
            stats.sent++;
            await prisma.stockNotification.updateMany({
              where: { id: notification.id, processingAt: now, sentAt: null },
              data: { sentAt: new Date(), processingAt: null, lastError: null },
            });
          } else {
            stats.failed++;
            await prisma.stockNotification.updateMany({
              where: { id: notification.id, processingAt: now, sentAt: null },
              data: {
                processingAt: null,
                lastError: 'ارسال پیامک ناموفق بود.',
              },
            });
          }
        }),
      );
    }
  } catch (error) {
    // Stock persistence must remain successful even if the notification
    // subsystem or SMS provider is temporarily unavailable.
    console.error('[stock-notification:dispatch]', error);
  }

  return stats;
}
