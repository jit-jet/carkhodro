/**
 * Invoice sync: site orders ↔ Hesabfa sales invoices.
 * Hesabfa → site only updates orders that already have a `hesabfaCode`.
 */

import type { OrderStatus, PaymentStatus, Prisma } from '@/generated/prisma_client';
import { prisma } from '@/src/lib/prisma';
import { netLineTotal } from '@/src/lib/pricing';
import {
  changeInvoicePaidStatus,
  changeInvoiceSentStatus,
  getInvoicesById,
  isHesabfaConfigured,
  saveInvoice,
  saveInvoicePayment,
} from './client';
import { pushContactToHesabfa } from './contacts';
import { tomanToRial } from './currency';
import {
  HESABFA_INVOICE_NOTE,
  HESABFA_INVOICE_TYPE_SALE,
  HESABFA_TAG,
  type HesabfaInvoice,
} from './types';
import { getSystemConfig } from '@/src/lib/system-settings';

export interface InvoiceSyncStats {
  updated: number;
  skipped: number;
}

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
    user: { select: { id: true; hesabfaCode: true; firstName: true; lastName: true } };
  };
}>;

function invoiceNumber(inv: HesabfaInvoice): string {
  return inv.Number != null ? String(inv.Number).trim() : '';
}

function formatHesabfaDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function loadOrder(orderId: string): Promise<OrderWithItems | null> {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { id: true, hesabfaCode: true, firstName: true, lastName: true } },
    },
  });
}

async function ensureContactCode(userId: string, existing: string | null): Promise<string | null> {
  if (existing) return existing;
  await pushContactToHesabfa(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hesabfaCode: true },
  });
  return user?.hesabfaCode ?? null;
}

async function resolveItemCodes(
  items: OrderWithItems['items'],
): Promise<Array<{ item: OrderWithItems['items'][number]; itemCode: string }>> {
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, hesabfaCode: true, sku: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const product = byId.get(item.productId);
    const itemCode = product?.hesabfaCode?.trim() || product?.sku || item.productSku;
    return { item, itemCode };
  });
}

function buildInvoicePayload(
  order: OrderWithItems,
  contactCode: string,
  lines: Array<{ item: OrderWithItems['items'][number]; itemCode: string }>,
  opts: { paidNote: boolean },
): Record<string, unknown> {
  const now = order.paidAt ?? order.createdAt;
  const date = formatHesabfaDate(now);

  const invoiceItems = lines.map(({ item, itemCode }, idx) => {
    const discountPct = Number(item.discountPct);
    const listToman = Number(item.priceAtPurchase);
    const netUnit = netLineTotal(listToman, 1, discountPct);
    const lineDiscountToman = Math.max(0, Math.round((listToman - netUnit) * item.quantity));
    return {
      rowNumber: idx + 1,
      description: item.productName,
      itemCode,
      unit: 'عدد',
      quantity: item.quantity,
      unitPrice: tomanToRial(listToman),
      discount: tomanToRial(lineDiscountToman),
      tax: tomanToRial(item.taxAmount),
    };
  });

  const others: Array<{ title: string; amount: number; add: boolean }> = [];
  if (order.shippingCost > BigInt(0)) {
    others.push({
      title: 'هزینه ارسال',
      amount: tomanToRial(order.shippingCost),
      add: true,
    });
  }
  if (order.discountAmount > BigInt(0)) {
    others.push({
      title: order.discountCode ? `تخفیف ${order.discountCode}` : 'تخفیف',
      amount: tomanToRial(order.discountAmount),
      add: false,
    });
  }

  return {
    ...(order.hesabfaCode ? { number: order.hesabfaCode } : {}),
    reference: String(order.orderNumber),
    date,
    dueDate: date,
    contactCode,
    contactTitle: `${order.user.firstName} ${order.user.lastName}`.trim(),
    note: opts.paidNote ? HESABFA_INVOICE_NOTE : order.notes?.trim() || HESABFA_INVOICE_NOTE,
    sent: order.status === 'SHIPPED' || order.status === 'COMPLETED',
    invoiceType: HESABFA_INVOICE_TYPE_SALE,
    status: 1,
    tag: `${HESABFA_TAG}:${order.id}`,
    freight: 0,
    currency: 'IRR',
    invoiceItems,
    ...(others.length > 0 ? { others } : {}),
  };
}

async function persistInvoiceLink(orderId: string, saved: HesabfaInvoice): Promise<void> {
  const number = invoiceNumber(saved);
  if (!number) return;
  await prisma.order.update({
    where: { id: orderId },
    data: {
      hesabfaCode: number,
      hesabfaId: typeof saved.Id === 'number' ? saved.Id : undefined,
      hesabfaSyncedAt: new Date(),
    },
  });
}

async function markInvoicePaid(number: string, amountRial: number, ref?: string | null) {
  const bankCode = (await getSystemConfig()).hesabfaBankCode.trim();
  if (!bankCode) {
    console.warn(
      '[hesabfa:savePayment] bank code is not configured — falling back to changePaidStatus',
    );
    await changeInvoicePaidStatus(number, true);
    return;
  }

  // Prefer invoice/savePayment (Set Payment) immediately after successful IPG pay.
  try {
    await saveInvoicePayment({
      type: HESABFA_INVOICE_TYPE_SALE,
      number,
      bankCode,
      date: formatHesabfaDate(new Date()),
      amount: amountRial,
      transactionNumber: ref ?? undefined,
      description: HESABFA_INVOICE_NOTE,
      transactionFee: 0,
      currency: 'IRR',
    });
  } catch (err) {
    console.error('[hesabfa:savePayment] failed, falling back to changePaidStatus', err);
    await changeInvoicePaidStatus(number, true);
  }
}

/**
 * Create a paid sales invoice in Hesabfa after successful retail payment.
 */
export async function pushPaidRetailInvoice(orderId: string): Promise<void> {
  if (!(await isHesabfaConfigured())) return;

  const order = await loadOrder(orderId);
  console.log('order', order);
  if (!order) return;
  if (order.hesabfaCode) {
    // Already linked — refresh paid status.
    await markInvoicePaid(
      order.hesabfaCode,
      tomanToRial(order.totalAmount),
      order.paymentRefNumber,
    );
    await prisma.order.update({
      where: { id: orderId },
      data: { hesabfaSyncedAt: new Date() },
    });
    return;
  }

  const contactCode = await ensureContactCode(order.userId, order.user.hesabfaCode);
  if (!contactCode) {
    console.error('[hesabfa:pushPaidRetailInvoice] missing contact code', orderId);
    return;
  }

  const lines = await resolveItemCodes(order.items);
  const payload = buildInvoicePayload(order, contactCode, lines, { paidNote: true });
  const saved = await saveInvoice(payload);
  await persistInvoiceLink(orderId, saved);

  const number = invoiceNumber(saved);
  if (number) {
    await markInvoicePaid(number, tomanToRial(order.totalAmount), order.paymentRefNumber);
  }
}

/**
 * Create a sales invoice for a wholesale (COD) order submission.
 */
export async function pushWholesaleInvoice(orderId: string): Promise<void> {
  if (!(await isHesabfaConfigured())) return;

  const order = await loadOrder(orderId);
  if (!order || order.hesabfaCode) return;

  const contactCode = await ensureContactCode(order.userId, order.user.hesabfaCode);
  if (!contactCode) {
    console.error('[hesabfa:pushWholesaleInvoice] missing contact code', orderId);
    return;
  }

  const lines = await resolveItemCodes(order.items);
  const payload = buildInvoicePayload(order, contactCode, lines, { paidNote: false });
  const saved = await saveInvoice(payload);
  await persistInvoiceLink(orderId, saved);
}

/**
 * Push local order/payment/shipping status changes to Hesabfa.
 */
export async function syncOrderStatusToHesabfa(orderId: string): Promise<void> {
  if (!(await isHesabfaConfigured())) return;

  const order = await loadOrder(orderId);
  if (!order) return;

  if (!order.hesabfaCode) {
    if (order.paymentStatus === 'PAID' || order.status === 'PAID') {
      await pushPaidRetailInvoice(orderId);
      return;
    }
    if (order.paymentMethod === 'COD') {
      await pushWholesaleInvoice(orderId);
      return;
    }
    return;
  }

  const number = order.hesabfaCode;
  const isPaid =
    order.paymentStatus === 'PAID' ||
    order.status === 'PAID' ||
    order.status === 'SHIPPED' ||
    order.status === 'COMPLETED';
  const isSent = order.status === 'SHIPPED' || order.status === 'COMPLETED';

  try {
    if (isPaid) {
      await changeInvoicePaidStatus(number, true);
    }
  } catch (err) {
    console.error('[hesabfa:changePaidStatus]', err);
  }

  try {
    await changeInvoiceSentStatus(number, isSent);
  } catch (err) {
    console.error('[hesabfa:changeSentStatus]', err);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { hesabfaSyncedAt: new Date() },
  });
}

function mapHesabfaToLocalStatus(inv: HesabfaInvoice): {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paidAt?: Date | null;
  shippedAt?: Date | null;
} {
  const paid = Boolean(inv.Paid && inv.Paid > 0) || (inv.Rest != null && inv.Rest <= 0);
  const sent = inv.Sent === true;
  const patch: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paidAt?: Date | null;
    shippedAt?: Date | null;
  } = {};

  if (paid) {
    patch.paymentStatus = 'PAID';
    patch.paidAt = new Date();
    if (!sent) patch.status = 'PAID';
  }
  if (sent) {
    patch.status = 'SHIPPED';
    patch.shippedAt = new Date();
  }
  return patch;
}

/**
 * Apply Hesabfa invoice changes to existing local orders only.
 * Unknown invoices (no local hesabfaCode / hesabfaId match) are skipped.
 */
export async function syncInvoicesFromHesabfa(
  invoices: HesabfaInvoice[],
): Promise<InvoiceSyncStats> {
  const stats: InvoiceSyncStats = { updated: 0, skipped: 0 };

  for (const inv of invoices) {
    const number = invoiceNumber(inv);
    const hesabfaId = typeof inv.Id === 'number' ? inv.Id : undefined;

    const order =
      (number
        ? await prisma.order.findUnique({
            where: { hesabfaCode: number },
            select: { id: true, status: true, paymentStatus: true },
          })
        : null) ??
      (hesabfaId != null
        ? await prisma.order.findUnique({
            where: { hesabfaId },
            select: { id: true, status: true, paymentStatus: true },
          })
        : null);

    if (!order) {
      stats.skipped++;
      continue;
    }

    const patch = mapHesabfaToLocalStatus(inv);
    if (!patch.status && !patch.paymentStatus) {
      stats.skipped++;
      continue;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        ...patch,
        hesabfaCode: number || undefined,
        ...(hesabfaId != null ? { hesabfaId } : {}),
        hesabfaSyncedAt: new Date(),
      },
    });
    stats.updated++;
  }

  return stats;
}

export async function syncInvoicesByIds(ids: number[]): Promise<InvoiceSyncStats> {
  const invoices = await getInvoicesById(ids);
  return syncInvoicesFromHesabfa(invoices);
}
