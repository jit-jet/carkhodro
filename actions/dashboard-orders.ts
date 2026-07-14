'use server';

/**
 * Partner orders + invoice Server Actions («سفارشات» / «فاکتور»).
 * ───────────────────────────────────────────────────────────────
 * Reads for the paginated/filterable order list and the full printable invoice.
 * Both are scoped to the current user so a forged id/invoice number can't leak
 * another partner's order. Per-user / dynamic — never cached.
 */

import { prisma } from '@/src/lib/prisma';
import { safeQuery } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { ORDER_STATUS_FA } from '@/src/lib/order-labels';
import {
  formatJalaliDate,
  formatJalaliSlash,
  formatJalaliWithWeekday,
  formatTimeFa,
} from '@/src/lib/format';
import { PER_PAGE_OPTIONS, DEFAULT_PER_PAGE } from '@/src/lib/dashboard-options';
import type { OrderStatus, Prisma } from '@/generated/prisma_client';
import type {
  OrdersPageVM,
  OrderListItemVM,
  InvoiceVM,
  InvoiceLineVM,
} from '@/src/lib/dashboard-types';

export interface OrdersQuery {
  status?: OrderStatus;
  page?: number;
  perPage?: number;
  orderNumber?: string;
}

const EMPTY_PAGE: OrdersPageVM = {
  items: [],
  total: 0,
  page: 1,
  perPage: DEFAULT_PER_PAGE,
  pageCount: 0,
};

export async function getOrdersPage(query: OrdersQuery = {}): Promise<OrdersPageVM> {
  const user = await getCurrentUser();
  if (!user) return EMPTY_PAGE;

  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(query.perPage ?? 0)
    ? (query.perPage as number)
    : DEFAULT_PER_PAGE;
  const page = Math.max(1, Math.floor(query.page ?? 1));

  const where: Prisma.OrderWhereInput = { userId: user.id };
  if (query.status) where.status = query.status;
  const parsedNumber = query.orderNumber ? Number(query.orderNumber.replace(/\D/g, '')) : NaN;
  if (Number.isFinite(parsedNumber) && parsedNumber > 0) where.orderNumber = parsedNumber;

  return safeQuery(
    'getOrdersPage',
    async () => {
      const total = await prisma.order.count({ where });
      const pageCount = Math.max(1, Math.ceil(total / perPage));
      const safePage = Math.min(page, pageCount);

      const rows = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * perPage,
        take: perPage,
        include: {
          items: { select: { quantity: true } },
          survey: { select: { id: true } },
        },
      });

      const items: OrderListItemVM[] = rows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        statusLabel: ORDER_STATUS_FA[o.status],
        dateFull: `${formatJalaliWithWeekday(o.createdAt)} - ${formatTimeFa(o.createdAt)}`,
        totalToman: Number(o.totalAmount),
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        hasSurvey: o.survey !== null,
      }));

      return { items, total, page: safePage, perPage, pageCount } satisfies OrdersPageVM;
    },
    EMPTY_PAGE,
  );
}

export async function getInvoice(id: string): Promise<InvoiceVM | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return safeQuery(
    `getInvoice:${id}`,
    async () => {
      const order = await prisma.order.findFirst({
        where: { id, userId: user.id },
        include: {
          items: { orderBy: { id: 'asc' } },
          survey: { select: { id: true } },
        },
      });
      if (!order) return null;

      const lines: InvoiceLineVM[] = order.items.map((it, index) => {
        const unit = Number(it.priceAtPurchase);
        const discountPct = Number(it.discountPct);
        const gross = unit * it.quantity;
        const net = Math.round((gross * (100 - discountPct)) / 100);
        return {
          rowNo: index + 1,
          sku: it.productSku,
          name: it.productName,
          unitPriceToman: unit,
          quantity: it.quantity,
          discountPct,
          lineGrossToman: gross,
          lineNetToman: net,
        };
      });

      const subtotalToman = lines.reduce((s, l) => s + l.lineGrossToman, 0);
      const payableToman = Number(order.totalAmount);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: ORDER_STATUS_FA[order.status],
        date: formatJalaliDate(order.createdAt),
        dateSlash: formatJalaliSlash(order.createdAt),
        time: formatTimeFa(order.createdAt),
        paymentTerms: order.paymentTerms,
        notes: order.notes,
        buyerName: `${user.firstName} ${user.lastName}`.trim(),
        phoneNumber: user.phoneNumber,
        address: {
          province: order.snapshotProvince,
          city: order.snapshotCity,
          street: order.snapshotStreet,
          postalCode: order.snapshotPostalCode,
        },
        lines,
        totalItems: lines.reduce((s, l) => s + l.quantity, 0),
        subtotalToman,
        discountToman: subtotalToman - Number(order.subtotal),
        payableToman,
        previousBalanceToman: Number(user.accountBalance),
        isRetail: user.role === 'RETAIL',
        hasSurvey: order.survey !== null,
      } satisfies InvoiceVM;
    },
    null,
  );
}
