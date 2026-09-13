/**
 * Invoice sync: site orders ↔ all four Hesabfa invoice types.
 */

import type { Prisma } from '@/generated/prisma_client';
import { prisma } from '@/src/lib/prisma';
import { netLineTotalForRole } from '@/src/lib/pricing';
import {
  changeInvoicePaidStatus,
  changeInvoiceSentStatus,
  getInvoicesById,
  getInvoiceByNumber,
  getAllInvoices,
  getContactByCode,
  getContactsByMobiles,
  isHesabfaConfigured,
  saveInvoice,
  saveInvoicePayment,
} from './client';
import { getRetailInvoiceContactCode, pushContactToHesabfa, syncContactsFromHesabfa } from './contacts';
import { rialToToman, tomanToRial } from './currency';
import {
  HESABFA_INVOICE_NOTE,
  HESABFA_INVOICE_TYPE_SALE,
  HESABFA_TAG,
  type HesabfaInvoice,
} from './types';
import { getSystemConfig } from '@/src/lib/system-settings';
import { mapHesabfaToLocalStatus } from './invoice-status';
import { hesabfaInvoiceStatusForRole } from './invoice-approval';
import { normalizeIranMobile } from './phone';
import { INVOICE_TYPES, isInvoiceType } from './invoice-type';
import { planInvoiceIdentitySync } from './invoice-identity';
import { displayName } from './contact-name';
import { hydrateInvoiceBatch } from './invoice-hydration';

export interface InvoiceSyncStats {
  created: number;
  updated: number;
  skipped: number;
  byType: Record<number, { created: number; updated: number; skipped: number }>;
}

const INVOICE_BATCH_SIZE = 20;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
    user: { select: { id: true; role: true; hesabfaCode: true; firstName: true; lastName: true } };
  };
}>;

type InvoiceLine = Omit<
  Pick<
    OrderWithItems['items'][number],
    | 'productId'
    | 'productName'
    | 'productSku'
    | 'priceAtPurchase'
    | 'discountPct'
    | 'taxAmount'
    | 'quantity'
  >,
  'discountPct'
> & { discountPct: number | Prisma.Decimal };

export type WholesaleInvoiceDraft = Pick<
  OrderWithItems,
  | 'id'
  | 'orderNumber'
  | 'paidAt'
  | 'createdAt'
  | 'shippingCost'
  | 'discountAmount'
  | 'discountCode'
  | 'notes'
  | 'status'
  | 'hesabfaCode'
> & {
  userId: string;
  user: Pick<OrderWithItems['user'], 'role' | 'hesabfaCode' | 'firstName' | 'lastName'>;
  items: InvoiceLine[];
};

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
      user: { select: { id: true, role: true, hesabfaCode: true, firstName: true, lastName: true } },
    },
  });
}

async function ensureContactCode(
  userId: string,
  role: OrderWithItems['user']['role'],
  existing: string | null,
): Promise<string | null> {
  if (role === 'RETAIL') return getRetailInvoiceContactCode();
  if (role !== 'WHOLESALE') return null;
  if (existing) return existing;
  await pushContactToHesabfa(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hesabfaCode: true },
  });
  return user?.hesabfaCode ?? null;
}

async function resolveItemCodes(
  items: InvoiceLine[],
): Promise<Array<{ item: InvoiceLine; itemCode: string }>> {
  const productIds = items
    .map((item) => item.productId)
    .filter((id): id is string => id != null);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, hesabfaCode: true, sku: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const product = item.productId ? byId.get(item.productId) : undefined;
    const itemCode = product?.hesabfaCode?.trim() || product?.sku || item.productSku;
    return { item, itemCode };
  });
}

function buildInvoicePayload(
  order: WholesaleInvoiceDraft,
  contactCode: string,
  lines: Array<{ item: InvoiceLine; itemCode: string }>,
  opts: { paidNote: boolean },
): Record<string, unknown> {
  const now = order.paidAt ?? order.createdAt;
  const date = formatHesabfaDate(now);

  const invoiceItems = lines.map(({ item, itemCode }, idx) => {
    const discountPct = Number(item.discountPct);
    const listToman = Number(item.priceAtPurchase);
    const netUnit = netLineTotalForRole(listToman, 1, discountPct, order.user.role);
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
    status: hesabfaInvoiceStatusForRole(order.user.role),
    tag: `${HESABFA_TAG}:${order.id}`,
    freight: 0,
    currency: 'IRR',
    invoiceItems,
    ...(others.length > 0 ? { others } : {}),
  };
}

/** Save a new wholesale invoice before creating the local order. Hesabfa assigns Number. */
export async function saveNewWholesaleInvoice(
  order: WholesaleInvoiceDraft,
): Promise<{ code: string; id: number | null }> {
  if (order.hesabfaCode) {
    throw new Error('Order is already linked to a Hesabfa invoice');
  }
  if (!(await isHesabfaConfigured())) {
    throw new Error('Hesabfa is not configured');
  }
  const contactCode = await ensureContactCode(
    order.userId,
    order.user.role,
    order.user.hesabfaCode,
  );
  if (!contactCode) throw new Error('Hesabfa contact code is missing');

  const lines = await resolveItemCodes(order.items);
  const payload = buildInvoicePayload(order, contactCode, lines, { paidNote: false });
  const saved = await saveInvoice(payload);
  const code = invoiceNumber(saved);
  if (!code || code === '0') {
    throw new Error('Hesabfa returned an invalid invoice number');
  }
  return { code, id: typeof saved.Id === 'number' ? saved.Id : null };
}

async function persistInvoiceLink(orderId: string, saved: HesabfaInvoice): Promise<void> {
  const number = invoiceNumber(saved);
  if (!number || number === '0') {
    throw new Error('Hesabfa returned an invalid invoice number');
  }
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

  const contactCode = await ensureContactCode(
    order.userId,
    order.user.role,
    order.user.hesabfaCode,
  );
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

  const contactCode = await ensureContactCode(
    order.userId,
    order.user.role,
    order.user.hesabfaCode,
  );
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
  const isPaid = order.source === 'OFFLINE'
    ? order.paymentStatus === 'PAID'
    : order.paymentStatus === 'PAID' ||
      order.status === 'PAID' ||
      order.status === 'SHIPPED' ||
      order.status === 'COMPLETED';
  const isSent = order.status === 'SHIPPED' || order.status === 'COMPLETED';

  try {
    if (isPaid) {
      await changeInvoicePaidStatus(number, true, order.invoiceType);
    }
  } catch (err) {
    console.error('[hesabfa:changePaidStatus]', err);
  }

  try {
    await changeInvoiceSentStatus(number, isSent, order.invoiceType);
  } catch (err) {
    console.error('[hesabfa:changeSentStatus]', err);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { hesabfaSyncedAt: new Date() },
  });
}

function emptyStats(): InvoiceSyncStats {
  return {
    created: 0, updated: 0, skipped: 0,
    byType: Object.fromEntries(INVOICE_TYPES.map((type) => [type, { created: 0, updated: 0, skipped: 0 }])),
  };
}

function addStats(target: InvoiceSyncStats, source: InvoiceSyncStats): void {
  target.created += source.created;
  target.updated += source.updated;
  target.skipped += source.skipped;
  for (const type of INVOICE_TYPES) {
    for (const key of ['created', 'updated', 'skipped'] as const) {
      target.byType[type]![key] += source.byType[type]![key];
    }
  }
}

/** Resolve the invoice contact without assigning someone else's orders by name. */
async function resolveInvoiceUser(inv: HesabfaInvoice): Promise<string> {
  const code = String(inv.ContactCode ?? inv.Contact?.Code ?? '').trim();
  if (code) {
    const linked = await prisma.user.findUnique({ where: { hesabfaCode: code }, select: { id: true } });
    if (linked) return linked.id;
  }

  const contact = inv.Contact?.Code != null ? inv.Contact : code ? await getContactByCode(code) : null;
  const mobile = normalizeIranMobile(contact?.Mobile);
  if (contact && mobile) {
    const local = await prisma.user.findUnique({
      where: { phoneNumber: mobile }, select: { id: true, role: true, hesabfaCode: true },
    });
    if (!local?.hesabfaCode || local.hesabfaCode === code) {
      const localPart = mobile.slice(1);
      const candidates = await getContactsByMobiles([
        contact.Mobile?.trim() ?? '', mobile, localPart,
        `98${localPart}`, `+98${localPart}`, `0098${localPart}`,
      ]);
      const matchingCodes = new Set(candidates.filter((row) => normalizeIranMobile(row.Mobile) === mobile)
        .map((row) => String(row.Code).trim()));
      matchingCodes.add(code);
      if (matchingCodes.size === 1) {
        if (local?.role === 'RETAIL') return local.id;
        await syncContactsFromHesabfa([contact]);
        const linked = await prisma.user.findUnique({ where: { hesabfaCode: code }, select: { id: true } });
        if (linked) return linked.id;
      }
    }
  }

  // A supplier or offline customer may have no mobile. Keep a deterministic
  // account with a non-login phone so the invoice is represented and later
  // contact sync can attach a real mobile to the same code.
  const identity = code || 'unassigned';
  const placeholderPhone = `hesabfa:${identity}`;
  const name = contact ? displayName(contact) : {
    firstName: inv.ContactTitle?.trim() || 'Offline', lastName: '',
  };
  const user = code
    ? await prisma.user.upsert({
        where: { hesabfaCode: code }, update: {},
        create: {
          phoneNumber: placeholderPhone,
          firstName: name.firstName,
          lastName: name.lastName, role: 'WHOLESALE', isActive: contact?.Active !== false, hesabfaCode: code,
        },
        select: { id: true },
      })
    : await prisma.user.upsert({
        where: { phoneNumber: placeholderPhone }, update: {},
        create: { phoneNumber: placeholderPhone, firstName: 'Offline', lastName: 'Order', role: 'WHOLESALE', isActive: false },
        select: { id: true },
      });
  return user.id;
}

function invoiceDate(value: string | undefined): Date {
  const parsed = value ? new Date(value.replace(' ', 'T')) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function importInvoice(inv: HesabfaInvoice): Promise<'created' | 'updated' | 'skipped'> {
  const type = inv.InvoiceType;
  const number = invoiceNumber(inv);
  if (!isInvoiceType(type) || !number || number === '0') return 'skipped';
  const id = typeof inv.Id === 'number' ? inv.Id : null;
  const tagOrderId = type === 0 && inv.Tag?.startsWith(`${HESABFA_TAG}:`)
    ? inv.Tag.slice(HESABFA_TAG.length + 1) : null;
  const orderSelect = { id: true, source: true, hesabfaCode: true, hesabfaId: true, invoiceType: true, paidAt: true, shippedAt: true } as const;
  const [byNumber, byId, byTag] = await Promise.all([
    prisma.order.findUnique({
      where: { hesabfaCode_invoiceType: { hesabfaCode: number, invoiceType: type } },
      select: orderSelect,
    }),
    id != null ? prisma.order.findUnique({ where: { hesabfaId: id }, select: orderSelect }) : null,
    tagOrderId ? prisma.order.findUnique({ where: { id: tagOrderId }, select: orderSelect }) : null,
  ]);
  const candidates = [byNumber, byId, byTag].filter((row): row is NonNullable<typeof row> => row != null);
  const plan = planInvoiceIdentitySync(
    [{ number, hesabfaId: id ?? undefined, invoiceType: type }],
    candidates,
  );
  const matchedId = plan.matches[0]?.orderId;
  const existing = byTag ?? candidates.find((row) => row.id === matchedId);
  if (byTag && byNumber && byTag.id !== byNumber.id) return 'skipped';

  // A site invoice can arrive before its order transaction commits. Its tag
  // identifies it unambiguously; the next webhook/full sync links it then.
  if (!existing && type === 0 && inv.Tag?.startsWith(`${HESABFA_TAG}:`)) return 'skipped';

  for (const release of plan.hesabfaIdsToRelease) {
    await prisma.order.updateMany({ where: { id: release.orderId, hesabfaId: release.hesabfaId }, data: { hesabfaId: null } });
  }
  if (id != null && byTag && byId && byTag.id !== byId.id) {
    await prisma.order.updateMany({ where: { id: byId.id, hesabfaId: id }, data: { hesabfaId: null } });
  }

  if (existing?.source === 'ONLINE') {
    await prisma.order.update({
      where: { id: existing.id },
      data: {
        ...mapHesabfaToLocalStatus(inv),
        hesabfaCode: number,
        invoiceType: type,
        ...(id != null ? { hesabfaId: id } : {}),
        hesabfaSyncedAt: new Date(),
      },
    });
    return 'updated';
  }

  // Full-list rows have no InvoiceItems. Never replace line snapshots from a
  // summary; callers hydrate each invoice before reaching this point.
  if (!Array.isArray(inv.InvoiceItems)) return 'skipped';
  const itemCodes = [...new Set(inv.InvoiceItems.map((line) =>
    String(line.ItemCode ?? line.Item?.Code ?? '').trim()).filter(Boolean))];
  const itemIds = inv.InvoiceItems.map((line) => line.Item?.Id).filter((value): value is number => typeof value === 'number');
  const [userId, products] = await Promise.all([
    resolveInvoiceUser(inv),
    prisma.product.findMany({
      where: { OR: [{ hesabfaCode: { in: itemCodes } }, { sku: { in: itemCodes } }, { hesabfaId: { in: itemIds } }] },
      select: { id: true, sku: true, name: true, hesabfaCode: true, hesabfaId: true },
    }),
  ]);
  const byCode = new Map(products.filter((p) => p.hesabfaCode).map((p) => [p.hesabfaCode!, p]));
  const bySku = new Map(products.map((p) => [p.sku, p]));
  const byItemId = new Map(products.filter((p) => p.hesabfaId != null).map((p) => [p.hesabfaId!, p]));
  const lines = inv.InvoiceItems.map((line) => {
    const code = String(line.ItemCode ?? line.Item?.Code ?? '').trim();
    const product = byCode.get(code) ?? bySku.get(code) ?? (line.Item?.Id != null ? byItemId.get(line.Item.Id) : undefined);
    const quantity = Math.max(1, Math.round(Number(line.Quantity) || 1));
    const priceAtPurchase = rialToToman(line.UnitPrice);
    const grossRial = Number(line.UnitPrice ?? 0) * quantity;
    const discountPct = grossRial > 0 ? Math.min(100, Math.max(0, Number(line.Discount ?? 0) / grossRial * 100)) : 0;
    return {
      productId: product?.id ?? null,
      productSku: product?.sku ?? code,
      productName: line.Description?.trim() || product?.name || line.Item?.Name?.trim() || code || 'Item',
      priceAtPurchase,
      discountPct,
      taxAmount: rialToToman(line.Tax),
      quantity,
    };
  });
  const shippingCost = rialToToman(inv.Freight);
  const taxAmount = lines.reduce((sum, line) => sum + line.taxAmount, BigInt(0));
  const totalAmount = rialToToman(inv.Payable ?? inv.Sum);
  const subtotal = totalAmount > shippingCost + taxAmount ? totalAmount - shippingCost - taxAmount : BigInt(0);
  const paid = inv.Rest != null ? Number(inv.Rest) <= 0 : Number(inv.Paid ?? 0) > 0;
  const now = new Date();
  const data = {
    userId,
    source: 'OFFLINE' as const,
    invoiceType: type,
    status: inv.Sent ? 'SHIPPED' as const : paid ? 'PAID' as const : 'NEW' as const,
    paymentMethod: 'COD' as const,
    paymentStatus: paid ? 'PAID' as const : 'PENDING' as const,
    paidAt: paid ? existing?.paidAt ?? now : null,
    shippedAt: inv.Sent ? existing?.shippedAt ?? now : null,
    snapshotProvince: contactState(inv),
    snapshotCity: inv.Contact?.City?.trim() ?? '',
    snapshotStreet: inv.Contact?.Address?.trim() ?? '',
    snapshotPostalCode: inv.Contact?.PostalCode?.trim() ?? '',
    subtotal, shippingCost, taxAmount, totalAmount,
    notes: inv.Note?.trim() || null,
    hesabfaCode: number, hesabfaId: id, hesabfaSyncedAt: now,
  };

  const result = await prisma.$transaction(async (tx) => {
    let orderId = existing?.id;
    let created = false;
    if (!orderId) {
      const inserted = await tx.order.createMany({
        data: [{ ...data, createdAt: invoiceDate(inv.Date) }], skipDuplicates: true,
      });
      created = inserted.count > 0;
      const row = await tx.order.findUnique({
        where: { hesabfaCode_invoiceType: { hesabfaCode: number, invoiceType: type } },
        select: { id: true, source: true },
      });
      if (!row) throw new Error(`Could not link Hesabfa invoice ${type}/${number}`);
      orderId = row.id;
      if (row.source === 'ONLINE') return 'updated' as const;
      if (!created) await tx.order.update({ where: { id: orderId }, data });
    } else {
      await tx.order.update({ where: { id: orderId }, data });
    }
    const currentLines = await tx.orderItem.findMany({ where: { orderId } });
    const key = (line: Omit<typeof lines[number], 'discountPct'> & { discountPct: number | Prisma.Decimal }) => JSON.stringify([
      line.productId, line.productSku, line.productName, String(line.priceAtPurchase),
      Number(line.discountPct), String(line.taxAmount), line.quantity,
    ]);
    const currentKeys = currentLines.map(key).sort();
    const incomingKeys = lines.map(key).sort();
    if (JSON.stringify(currentKeys) !== JSON.stringify(incomingKeys)) {
      await tx.orderItem.deleteMany({ where: { orderId } });
      if (lines.length > 0) await tx.orderItem.createMany({ data: lines.map((line) => ({ ...line, orderId })) });
    }
    return created ? 'created' as const : 'updated' as const;
  });
  return result;
}

function contactState(inv: HesabfaInvoice): string {
  return inv.Contact?.State?.trim() ?? '';
}

/** Idempotent importer shared by webhooks and manual full synchronization. */
export async function syncInvoicesFromHesabfa(invoices: HesabfaInvoice[]): Promise<InvoiceSyncStats> {
  const stats = emptyStats();
  const seen = new Set<string>();
  for (const invoice of invoices) {
    const type = invoice.InvoiceType;
    const key = `${type}:${invoiceNumber(invoice)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const outcome = await importInvoice(invoice);
    stats[outcome]++;
    if (isInvoiceType(type)) stats.byType[type]![outcome]++;
  }
  return stats;
}

export async function syncInvoicesByIds(ids: number[]): Promise<InvoiceSyncStats> {
  return syncInvoicesFromHesabfa(await getInvoicesById(ids));
}

/** Fetch every type, then hydrate each batch by ID with per-number fallback. */
export async function fullSyncInvoices(): Promise<InvoiceSyncStats> {
  const summary = emptyStats();
  for (const type of INVOICE_TYPES) {
    const listed = await getAllInvoices(type);
    if (listed.length === 0) continue;

    // Start the next API batch while the current batch is being written. The
    // wrapped promise cannot reject unobserved if an import fails meanwhile.
    const fetchBatch = async (offset: number) => {
      try {
        const detailed = await hydrateInvoiceBatch(listed.slice(offset, offset + INVOICE_BATCH_SIZE), type, {
          getByIds: getInvoicesById,
          getByNumber: getInvoiceByNumber,
        });
        return { ok: true as const, detailed };
      } catch (error) {
        return { ok: false as const, error };
      }
    };
    let pendingBatch = fetchBatch(0);
    for (let offset = 0; offset < listed.length; offset += INVOICE_BATCH_SIZE) {
      const batch = listed.slice(offset, offset + INVOICE_BATCH_SIZE);
      const fetched = await pendingBatch;
      if (!fetched.ok) throw fetched.error;
      if (offset + INVOICE_BATCH_SIZE < listed.length) pendingBatch = fetchBatch(offset + INVOICE_BATCH_SIZE);
      const detailed = fetched.detailed;
      const available = detailed.filter((row): row is HesabfaInvoice => row != null)
        .map((row) => ({ ...row, InvoiceType: row.InvoiceType ?? type }));
      addStats(summary, await syncInvoicesFromHesabfa(available));
      const missing = batch.length - available.length;
      summary.skipped += missing;
      summary.byType[type]!.skipped += missing;
    }
  }
  return summary;
}
