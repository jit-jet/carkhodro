'use server';

/**
 * Partner dashboard stats Server Action.
 * ──────────────────────────────────────
 * One read that powers every card on the dashboard home: ledger balance, order
 * counts by lifecycle bucket, cart size, backorders, favorites and a pointer to
 * the most recent invoice. Per-user / dynamic (reads the session cookie) — never
 * cached. Returns `null` for guests (the page redirects them via the proxy).
 */

import { prisma } from '@/src/lib/prisma';
import { getCurrentUser } from '@/src/lib/session';
import { safeQuery } from '@/src/lib/result';
import { USER_ROLE_FA } from '@/src/lib/user-labels';
import { formatJalaliDate } from '@/src/lib/format';
import type { OrderStatus } from '@/generated/prisma_client';
import type { DashboardStatsVM } from '@/src/lib/dashboard-types';

/** Orders still moving through the pipeline (not completed / cancelled / archived). */
const IN_PROGRESS_STATUSES: OrderStatus[] = [
  'NEW',
  'AWAITING_CONFIRMATION',
  'CONFIRMED_AWAITING_PAYMENT',
  'PAID',
  'SHIPPED',
];

export async function getDashboardStats(): Promise<DashboardStatsVM | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return safeQuery(
    'getDashboardStats',
    async () => {
      const [
        completedOrders,
        inProgressOrders,
        totalOrders,
        cartItems,
        backorderCount,
        favoritesCount,
        lastOrder,
      ] = await Promise.all([
        prisma.order.count({ where: { userId: user.id, status: 'COMPLETED' } }),
        prisma.order.count({
          where: { userId: user.id, status: { in: IN_PROGRESS_STATUSES } },
        }),
        prisma.order.count({ where: { userId: user.id } }),
        prisma.cartItem.findMany({
          where: { cart: { userId: user.id } },
          select: { quantity: true },
        }),
        prisma.backorder.count({ where: { userId: user.id, status: 'PENDING' } }),
        prisma.wishlistItem.count({ where: { userId: user.id } }),
        prisma.order.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { id: true, orderNumber: true, createdAt: true },
        }),
      ]);

      return {
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        shopName: user.shopName ?? '',
        userType: USER_ROLE_FA[user.role],
        isRetail: user.role === 'RETAIL',
        partnerCode: user.partnerCode,
        profileImage: user.profileImage,
        hasAvatar: Boolean(user.profileImage),
        accountBalanceToman: Number(user.accountBalance),
        completedOrders,
        inProgressOrders,
        totalOrders,
        cartItemCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
        backorderCount,
        favoritesCount,
        lastInvoice: lastOrder
          ? {
              id: lastOrder.id,
              orderNumber: lastOrder.orderNumber,
              date: formatJalaliDate(lastOrder.createdAt),
            }
          : null,
      } satisfies DashboardStatsVM;
    },
    null,
  );
}
