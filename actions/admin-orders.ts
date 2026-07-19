'use server';

/**
 * Order management Server Actions — admin panel.
 * ─────────────────────────────────────────────
 * Lists all partners'/customers' orders, loads printable invoices without the
 * storefront user-scope filter, and updates status/details. Pure `use server`
 * so Client Components can import mutations directly.
 */

import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import {
  ORDER_STATUS_FA,
  PAYMENT_STATUS_FA,
  PAYMENT_METHOD_FA,
} from '@/src/lib/order-labels';
import { USER_ROLE_FA } from '@/src/lib/user-labels';
import {
  formatJalaliDate,
  formatJalaliSlash,
  formatJalaliWithWeekday,
  formatTimeFa,
} from '@/src/lib/format';
import type {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  Prisma,
} from '@/generated/prisma_client';
import type { InvoiceVM, InvoiceLineVM } from '@/src/lib/dashboard-types';

export type AdminOrderSortBy =
  | 'orderNumber'
  | 'customer'
  | 'phone'
  | 'status'
  | 'paymentStatus'
  | 'total'
  | 'createdAt';

export type AdminOrderSortDir = 'asc' | 'desc';

export interface AdminOrderListItemVM {
  id: string;
  orderNumber: number;
  customerName: string;
  phoneNumber: string;
  status: OrderStatus;
  statusLabel: string;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  totalToman: number;
  itemCount: number;
  dateFull: string;
  createdAtIso: string;
}

export interface AdminOrderFilters {
  orderNumber?: string;
  customer?: string;
  phone?: string;
  userId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  sortBy?: AdminOrderSortBy;
  sortDir?: AdminOrderSortDir;
  page?: number;
  perPage?: number;
}

export interface AdminOrderPage {
  items: AdminOrderListItemVM[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface AdminOrderDetailVM {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentTerms: string | null;
  notes: string | null;
  trackingCode: string | null;
  snapshotProvince: string;
  snapshotCity: string;
  snapshotStreet: string;
  snapshotPostalCode: string;
  subtotalToman: number;
  shippingCostToman: number;
  taxAmountToman: number;
  totalToman: number;
  createdAtLabel: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    shopName: string | null;
    roleLabel: string;
  };
  items: {
    id: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPriceToman: number;
    discountPct: number;
  }[];
}

export interface AdminOrderUpdateInput {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentTerms?: string | null;
  notes?: string | null;
  trackingCode?: string | null;
  snapshotProvince: string;
  snapshotCity: string;
  snapshotStreet: string;
  snapshotPostalCode: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerShopName?: string | null;
}

function adminOrderOrderBy(
  sortBy: AdminOrderSortBy | undefined,
  sortDir: AdminOrderSortDir | undefined,
) {
  const dir = sortDir === 'asc' ? ('asc' as const) : ('desc' as const);
  switch (sortBy) {
    case 'orderNumber':
      return { orderNumber: dir };
    case 'customer':
      return [{ user: { firstName: dir } }, { user: { lastName: dir } }];
    case 'phone':
      return { user: { phoneNumber: dir } };
    case 'status':
      return { status: dir };
    case 'paymentStatus':
      return { paymentStatus: dir };
    case 'total':
      return { totalAmount: dir };
    case 'createdAt':
      return { createdAt: dir };
    default:
      return { createdAt: 'desc' as const };
  }
}

export async function getOrdersAdmin(
  filters: AdminOrderFilters = {},
): Promise<AdminOrderPage> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 20));

  return safeQuery(
    'getOrdersAdmin',
    async () => {
      const customer = filters.customer?.trim();
      const phone = filters.phone?.trim();
      const parsedNumber = filters.orderNumber
        ? Number(filters.orderNumber.replace(/\D/g, ''))
        : NaN;

      const where: Prisma.OrderWhereInput = {
        ...(Number.isFinite(parsedNumber) && parsedNumber > 0
          ? { orderNumber: parsedNumber }
          : {}),
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
        ...(customer || phone
          ? {
              user: {
                ...(phone ? { phoneNumber: { contains: phone } } : {}),
                ...(customer
                  ? {
                      OR: [
                        { firstName: { contains: customer, mode: 'insensitive' as const } },
                        { lastName: { contains: customer, mode: 'insensitive' as const } },
                        { shopName: { contains: customer, mode: 'insensitive' as const } },
                      ],
                    }
                  : {}),
              },
            }
          : {}),
      };

      const orderBy = adminOrderOrderBy(filters.sortBy, filters.sortDir);

      const [rows, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
                shopName: true,
              },
            },
            items: { select: { quantity: true } },
          },
          orderBy,
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.order.count({ where }),
      ]);

      return {
        items: rows.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName:
            `${o.user.firstName} ${o.user.lastName}`.trim() ||
            o.user.shopName ||
            '—',
          phoneNumber: o.user.phoneNumber,
          status: o.status,
          statusLabel: ORDER_STATUS_FA[o.status],
          paymentStatus: o.paymentStatus,
          paymentStatusLabel: PAYMENT_STATUS_FA[o.paymentStatus],
          paymentMethod: o.paymentMethod,
          paymentMethodLabel: PAYMENT_METHOD_FA[o.paymentMethod],
          totalToman: Number(o.totalAmount),
          itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
          dateFull: `${formatJalaliWithWeekday(o.createdAt)} - ${formatTimeFa(o.createdAt)}`,
          createdAtIso: o.createdAt.toISOString(),
        })),
        total,
        page,
        perPage,
        pageCount: Math.max(1, Math.ceil(total / perPage)),
      };
    },
    { items: [], total: 0, page, perPage, pageCount: 1 },
  );
}

export async function getOrderAdminById(id: string): Promise<AdminOrderDetailVM | null> {
  return safeQuery(
    `getOrderAdminById:${id}`,
    async () => {
      const o = await prisma.order.findUnique({
        where: { id },
        include: {
          user: true,
          items: { orderBy: { id: 'asc' } },
        },
      });
      if (!o) return null;

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        paymentTerms: o.paymentTerms,
        notes: o.notes,
        trackingCode: o.trackingCode,
        snapshotProvince: o.snapshotProvince,
        snapshotCity: o.snapshotCity,
        snapshotStreet: o.snapshotStreet,
        snapshotPostalCode: o.snapshotPostalCode,
        subtotalToman: Number(o.subtotal),
        shippingCostToman: Number(o.shippingCost),
        taxAmountToman: Number(o.taxAmount),
        totalToman: Number(o.totalAmount),
        createdAtLabel: `${formatJalaliDate(o.createdAt)} — ${formatTimeFa(o.createdAt)}`,
        user: {
          id: o.user.id,
          firstName: o.user.firstName,
          lastName: o.user.lastName,
          phoneNumber: o.user.phoneNumber,
          shopName: o.user.shopName,
          roleLabel: USER_ROLE_FA[o.user.role],
        },
        items: o.items.map((it) => ({
          id: it.id,
          productName: it.productName,
          productSku: it.productSku,
          quantity: it.quantity,
          unitPriceToman: Number(it.priceAtPurchase),
          discountPct: Number(it.discountPct),
        })),
      };
    },
    null,
  );
}

/** Admin invoice loader — same shape as partner `getInvoice`, no user-scope. */
export async function getInvoiceAdmin(id: string): Promise<InvoiceVM | null> {
  return safeQuery(
    `getInvoiceAdmin:${id}`,
    async () => {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: { orderBy: { id: 'asc' } },
          survey: { select: { id: true } },
          user: true,
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
        buyerName: `${order.user.firstName} ${order.user.lastName}`.trim(),
        phoneNumber: order.user.phoneNumber,
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
        payableToman: Number(order.totalAmount),
        previousBalanceToman: Number(order.user.accountBalance),
        isRetail: order.user.role === 'RETAIL',
        hasSurvey: order.survey !== null,
      } satisfies InvoiceVM;
    },
    null,
  );
}

export async function updateOrderStatusAdmin(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  return runMutation('updateOrderStatusAdmin', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی مجاز نیست.');

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!existing) return fail('سفارش پیدا نشد.');

    const now = new Date();
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'PAID' ? { paidAt: now } : {}),
        ...(status === 'SHIPPED' ? { shippedAt: now } : {}),
        ...(status === 'COMPLETED' ? { deliveredAt: now } : {}),
      },
    });
    return ok(undefined);
  });
}

export async function updateOrderAdmin(
  orderId: string,
  input: AdminOrderUpdateInput,
): Promise<ActionResult> {
  return runMutation('updateOrderAdmin', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی مجاز نیست.');

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true },
    });
    if (!order) return fail('سفارش پیدا نشد.');

    if (!input.customerFirstName?.trim() || !input.customerLastName?.trim()) {
      return fail('نام و نام خانوادگی مشتری الزامی است.');
    }
    const phone = input.customerPhone.trim();
    if (!/^09\d{9}$/.test(phone)) {
      return fail('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.');
    }

    const phoneTaken = await prisma.user.findFirst({
      where: { phoneNumber: phone, id: { not: order.userId } },
      select: { id: true },
    });
    if (phoneTaken) return fail('این شماره موبایل متعلق به کاربر دیگری است.');

    const now = new Date();
    const statusChanged = input.status !== order.status;

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: input.status,
          paymentStatus: input.paymentStatus,
          paymentMethod: input.paymentMethod,
          paymentTerms: input.paymentTerms?.trim() || null,
          notes: input.notes?.trim() || null,
          trackingCode: input.trackingCode?.trim() || null,
          snapshotProvince: input.snapshotProvince.trim(),
          snapshotCity: input.snapshotCity.trim(),
          snapshotStreet: input.snapshotStreet.trim(),
          snapshotPostalCode: input.snapshotPostalCode.trim(),
          ...(statusChanged && input.status === 'PAID' ? { paidAt: now } : {}),
          ...(statusChanged && input.status === 'SHIPPED' ? { shippedAt: now } : {}),
          ...(statusChanged && input.status === 'COMPLETED' ? { deliveredAt: now } : {}),
        },
      }),
      prisma.user.update({
        where: { id: order.userId },
        data: {
          firstName: input.customerFirstName.trim(),
          lastName: input.customerLastName.trim(),
          phoneNumber: phone,
          shopName: input.customerShopName?.trim() || null,
        },
      }),
    ]);

    return ok(undefined);
  });
}
