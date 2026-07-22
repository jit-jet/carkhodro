/**
 * Admin dashboard home stats — one read powering the overview cards.
 * Uncached: admin needs fresh counts right after any mutation.
 */

import { prisma } from '@/src/lib/prisma';
import { safeQuery } from '@/src/lib/result';

export interface AdminDashboardStatsVM {
  productCount: number;
  activeProductCount: number;
  outOfStockCount: number;
  categoryCount: number;
  partnerCount: number;
  retailCount: number;
  pendingOrderCount: number;
  smsCampaignCount: number;
  unreadReviews: number;
  unreadSupport: number;
  unreadSuggestions: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStatsVM> {
  return safeQuery(
    'getAdminDashboardStats',
    async () => {
      const [
        productCount,
        activeProductCount,
        outOfStockCount,
        categoryCount,
        partnerCount,
        retailCount,
        pendingOrderCount,
        smsCampaignCount,
        unreadReviews,
        unreadSupport,
        unreadSuggestions,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isActive: true, stock: 0 } }),
        prisma.category.count(),
        prisma.user.count({ where: { role: 'WHOLESALE' } }),
        prisma.user.count({ where: { role: 'RETAIL' } }),
        prisma.order.count({
          where: { status: { in: ['NEW', 'AWAITING_CONFIRMATION', 'CONFIRMED_AWAITING_PAYMENT'] } },
        }),
        prisma.smsCampaign.count(),
        prisma.review.count({ where: { isRead: false } }),
        prisma.supportMessage.count({
          where: { direction: 'OUTBOUND', isDeleted: false, adminIsRead: false },
        }),
        prisma.productSuggestion.count({ where: { isRead: false } }),
      ]);

      return {
        productCount,
        activeProductCount,
        outOfStockCount,
        categoryCount,
        partnerCount,
        retailCount,
        pendingOrderCount,
        smsCampaignCount,
        unreadReviews,
        unreadSupport,
        unreadSuggestions,
      };
    },
    {
      productCount: 0,
      activeProductCount: 0,
      outOfStockCount: 0,
      categoryCount: 0,
      partnerCount: 0,
      retailCount: 0,
      pendingOrderCount: 0,
      smsCampaignCount: 0,
      unreadReviews: 0,
      unreadSupport: 0,
      unreadSuggestions: 0,
    },
  );
}
