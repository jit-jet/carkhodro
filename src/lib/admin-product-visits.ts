import 'server-only';

import { Prisma } from '@/generated/prisma_client';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import { clampPage, pageCountOf } from '@/src/lib/admin-pagination';
import { prisma } from '@/src/lib/prisma';

export type VisitRoleFilter = 'all' | 'RETAIL' | 'WHOLESALE';
export type VisitRangeFilter = '1' | '7' | '30' | 'all';
export type VisitPurchaseFilter = 'all' | 'purchased' | 'not_purchased';

export interface ProductVisitFilters {
  role: VisitRoleFilter;
  range: VisitRangeFilter;
  purchase: VisitPurchaseFilter;
  q: string;
}

export interface ProductVisitRow {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  shopName: string | null;
  phoneNumber: string;
  role: 'RETAIL' | 'WHOLESALE';
  productId: string;
  productName: string;
  productSku: string;
  viewedAt: Date;
  purchasedOrderId: string | null;
  purchasedOrderNumber: number | null;
  purchasedAt: Date | null;
  pendingOrderId: string | null;
  pendingOrderNumber: number | null;
}

interface CountRow { total: number }

/** Purchase means a non-cancelled online sales order that is paid/fulfilled. */
const purchasedCondition = Prisma.sql`(
  o.payment_status = 'PAID' OR o.paid_at IS NOT NULL
  OR o.status IN ('PAID', 'SHIPPED', 'COMPLETED')
)`;

export async function getProductVisitsReport(
  filters: ProductVisitFilters,
  requestedPage: number,
  perPage: number,
) {
  if (!(await getCurrentAdmin())) redirect('/admin/login');

  const since = filters.range === 'all'
    ? null
    : new Date(Date.now() - Number(filters.range) * 24 * 60 * 60 * 1000);
  const query = filters.q.trim().slice(0, 100);
  const search = `%${query}%`;

  const from = Prisma.sql`
    FROM product_visits v
    JOIN users u ON u.id = v.user_id
    JOIN products p ON p.id = v.product_id
    LEFT JOIN LATERAL (
      SELECT o.id, o.order_number,
        COALESCE(o.paid_at, o.shipped_at, o.delivered_at, o.created_at) AS purchased_at
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = v.product_id
        AND o.user_id = v.user_id
        AND o.source = 'ONLINE'
        AND o.invoice_type = 0
        AND o.status NOT IN ('CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_MANAGER')
        AND o.payment_status <> 'REFUNDED'
        AND ${purchasedCondition}
      ORDER BY o.created_at DESC
      LIMIT 1
    ) bought ON TRUE
    LEFT JOIN LATERAL (
      SELECT o.id, o.order_number
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = v.product_id
        AND o.user_id = v.user_id
        AND o.source = 'ONLINE'
        AND o.invoice_type = 0
        AND o.status NOT IN ('CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_MANAGER')
        AND o.payment_status <> 'REFUNDED'
        AND NOT ${purchasedCondition}
      ORDER BY o.created_at DESC
      LIMIT 1
    ) pending ON TRUE
    WHERE u.role IN ('RETAIL', 'WHOLESALE')
      ${since ? Prisma.sql`AND v.viewed_at >= ${since}` : Prisma.empty}
      ${filters.role !== 'all' ? Prisma.sql`AND u.role = ${filters.role}::"UserRole"` : Prisma.empty}
      ${query ? Prisma.sql`AND (
        u.first_name ILIKE ${search} OR u.last_name ILIKE ${search}
        OR u.phone_number ILIKE ${search} OR u.shop_name ILIKE ${search}
        OR p.name ILIKE ${search} OR p.sku ILIKE ${search}
      )` : Prisma.empty}
      ${filters.purchase === 'purchased' ? Prisma.sql`AND bought.id IS NOT NULL` : Prisma.empty}
      ${filters.purchase === 'not_purchased' ? Prisma.sql`AND bought.id IS NULL` : Prisma.empty}
  `;

  const [count] = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
    SELECT COUNT(*)::int AS total ${from}
  `);
  const total = count?.total ?? 0;
  const pageCount = pageCountOf(total, perPage);
  const page = clampPage(requestedPage, pageCount);
  const rows = await prisma.$queryRaw<ProductVisitRow[]>(Prisma.sql`
    SELECT v.id,
      u.id AS "userId", u.first_name AS "firstName", u.last_name AS "lastName",
      u.shop_name AS "shopName", u.phone_number AS "phoneNumber", u.role::text AS role,
      p.id AS "productId", p.name AS "productName", p.sku AS "productSku",
      v.viewed_at AS "viewedAt",
      bought.id AS "purchasedOrderId", bought.order_number AS "purchasedOrderNumber",
      bought.purchased_at AS "purchasedAt",
      pending.id AS "pendingOrderId", pending.order_number AS "pendingOrderNumber"
    ${from}
    ORDER BY v.viewed_at DESC, v.id DESC
    LIMIT ${perPage} OFFSET ${(page - 1) * perPage}
  `);

  return { items: rows, total, page, pageCount, perPage };
}
