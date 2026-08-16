/**
 * Hesabfa stock helpers — read `Stock` from item/get, push via purchase invoice.
 */

import { revalidateTag } from 'next/cache';
import { tags } from '@/actions/cache-tags';
import { prisma } from '@/src/lib/prisma';
import {
  getAllItems,
  getItemByCode,
  getItemsById,
  isHesabfaConfigured,
  saveInvoice,
} from './client';
import { tomanToRial } from './currency';
import {
  HESABFA_INVOICE_NOTE,
  HESABFA_INVOICE_TYPE_PURCHASE,
  HESABFA_INVOICE_TYPE_PURCHASE_RETURN,
  HESABFA_TAG,
  HESABFA_WAREHOUSE_RECEIPT_ISSUED,
  type HesabfaItem,
} from './types';
import { getSystemConfig } from '@/src/lib/system-settings';

export interface LiveStockLine {
  productId: string;
  name: string;
  quantity: number;
  hesabfaCode: string;
}

export interface LiveStockValidationIssue {
  productName: string;
  remaining: number;
  requested: number;
}

function formatHesabfaDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Parse inventory from item/get* — uses `Stock` only. */
export function stockFromHesabfaItem(item: Pick<HesabfaItem, 'Stock'> | null | undefined): number {
  return Math.max(0, Math.round(item?.Stock ?? 0));
}

function itemCodeOf(code: string | null | undefined): string {
  return code?.trim() ?? '';
}

/** Fetch live `Stock` from Hesabfa for item codes (item/get). */
export async function fetchHesabfaStockByCodes(
  codes: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!(await isHesabfaConfigured())) return map;

  const unique = [...new Set(codes.map((c) => c.trim()).filter(Boolean))];
  await Promise.all(
    unique.map(async (code) => {
      try {
        const item = await getItemByCode(code);
        if (item) map.set(code, stockFromHesabfaItem(item));
      } catch (err) {
        console.error('[hesabfa:stock:get]', code, err);
      }
    }),
  );
  return map;
}

function invalidateStock(productIds: string[]): void {
  if (productIds.length === 0) return;
  revalidateTag(tags.products, 'max');
  if (productIds.length <= 50) {
    for (const id of productIds) revalidateTag(tags.product(id), 'max');
  }
}

async function persistStockItems(items: HesabfaItem[]): Promise<number> {
  const stockByCode = new Map<string, number>();
  for (const item of items) {
    const code = item.Code != null ? String(item.Code).trim() : '';
    if (code) stockByCode.set(code, stockFromHesabfaItem(item));
  }
  if (stockByCode.size === 0) return 0;

  const codes = [...stockByCode.keys()];
  const products = await prisma.product.findMany({
    where: {
      OR: [{ hesabfaCode: { in: codes } }, { sku: { in: codes } }],
    },
    select: { id: true, hesabfaCode: true, sku: true },
  });
  if (products.length === 0) return 0;

  const now = new Date();
  const productIdsByStock = new Map<number, string[]>();
  for (const product of products) {
    const hesabfaCode = product.hesabfaCode?.trim() || '';
    const sku = product.sku.trim();
    const code = stockByCode.has(hesabfaCode) ? hesabfaCode : sku;
    const stock = stockByCode.get(code);
    if (stock === undefined) continue;
    const productIds = productIdsByStock.get(stock) ?? [];
    productIds.push(product.id);
    productIdsByStock.set(stock, productIds);
  }

  await prisma.$transaction(
    [...productIdsByStock].map(([stock, productIds]) =>
      prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { stock, lastSyncedAt: now },
      }),
    ),
  );

  const productIds = [...productIdsByStock.values()].flat();
  invalidateStock(productIds);
  return productIds.length;
}

/** Refresh local stock by item codes extracted from changed invoices. */
export async function refreshLocalStockFromHesabfaCodes(codes: string[]): Promise<number> {
  if (!(await isHesabfaConfigured())) return 0;
  const stockByCode = await fetchHesabfaStockByCodes(codes);
  const items: HesabfaItem[] = [...stockByCode].map(([Code, Stock]) => ({
    Code,
    Stock,
    Name: '',
  }));
  return persistStockItems(items);
}

/** Deleted invoices have no retrievable lines, so refresh all item stocks. */
export async function refreshAllLocalStockFromHesabfa(): Promise<number> {
  if (!(await isHesabfaConfigured())) return 0;
  return persistStockItems(await getAllItems());
}

/** Refresh local Product.stock from Hesabfa item/get `Stock` (by numeric ids). */
export async function refreshLocalStockFromHesabfaIds(ids: number[]): Promise<number> {
  if (!(await isHesabfaConfigured()) || ids.length === 0) return 0;
  return persistStockItems(await getItemsById(ids));
}

/** Refresh local stock for cart/checkout lines and return live quantities. */
export async function resolveLiveStockForLines(
  lines: LiveStockLine[],
): Promise<Map<string, number>> {
  const byProduct = new Map<string, number>();
  if (lines.length === 0) return byProduct;

  const stockByCode = await fetchHesabfaStockByCodes(lines.map((l) => l.hesabfaCode));
  const now = new Date();

  for (const line of lines) {
    const live = stockByCode.get(line.hesabfaCode);
    const stock = live ?? 0;
    byProduct.set(line.productId, stock);
    await prisma.product.update({
      where: { id: line.productId },
      data: { stock, lastSyncedAt: now },
    });
  }

  return byProduct;
}

/** Compare cart quantities to live Hesabfa stock (also updates local Product.stock). */
export async function validateLinesAgainstHesabfaStock(
  lines: LiveStockLine[],
  fallbackStockByProduct?: Map<string, number>,
): Promise<{ issues: LiveStockValidationIssue[]; stockByProduct: Map<string, number> }> {
  if (lines.length === 0) {
    return { issues: [], stockByProduct: new Map() };
  }

  const liveByProduct = (await isHesabfaConfigured())
    ? await resolveLiveStockForLines(lines)
    : new Map(
        lines.map((line) => [
          line.productId,
          fallbackStockByProduct?.get(line.productId) ?? 0,
        ]),
      );

  const issues = lines
    .filter((line) => {
      const stock = liveByProduct.get(line.productId) ?? 0;
      return stock < line.quantity;
    })
    .map((line) => ({
      productName: line.name,
      remaining: Math.max(0, liveByProduct.get(line.productId) ?? 0),
      requested: line.quantity,
    }));

  return { issues, stockByProduct: liveByProduct };
}

async function purchaseContactCode(): Promise<string | null> {
  const code = (await getSystemConfig()).hesabfaPurchaseContactCode.trim();
  return code || null;
}

export interface PushStockViaPurchaseInput {
  itemCode: string;
  itemName: string;
  quantity: number;
  /** Buy/cost price in Toman for the invoice line. */
  unitPriceToman: number;
  reference?: string;
}

/**
 * Adjust Hesabfa inventory via purchase (invoiceType=1) or purchase return (invoiceType=3).
 * Positive qty → buy invoice; negative qty → return-from-buy invoice; zero → no-op.
 * Docs: https://www.hesabfa.com/help/api/Invoice — invoice/save
 */
export async function pushStockViaPurchaseInvoice(
  input: PushStockViaPurchaseInput,
): Promise<void> {
  if (!(await isHesabfaConfigured())) return;

  const qty = Math.round(input.quantity);
  if (qty === 0) return;

  const contactCode = await purchaseContactCode();
  if (!contactCode) {
    console.warn(
      '[hesabfa:purchaseStock] purchase contact is not configured — skipping stock push',
    );
    return;
  }

  const isReturn = qty < 0;
  const lineQty = Math.abs(qty);
  const now = formatHesabfaDate(new Date());
  const unitRial = tomanToRial(Math.max(1, input.unitPriceToman));

  await saveInvoice({
    reference: input.reference ?? `stock:${input.itemCode}:${Date.now()}`,
    date: now,
    dueDate: now,
    contactCode,
    note: isReturn
      ? `${HESABFA_INVOICE_NOTE} — برگشت از خرید (تعدیل موجودی)`
      : HESABFA_INVOICE_NOTE,
    sent: false,
    invoiceType: isReturn
      ? HESABFA_INVOICE_TYPE_PURCHASE_RETURN
      : HESABFA_INVOICE_TYPE_PURCHASE,
    status: 2,
    tag: `${HESABFA_TAG}:stock${isReturn ? ':return' : ''}`,
    freight: 0,
    warehouseReceiptStatus: HESABFA_WAREHOUSE_RECEIPT_ISSUED,
    currency: 'IRR',
    invoiceItems: [
      {
        rowNumber: 1,
        description: input.itemName,
        itemCode: input.itemCode,
        unit: 'عدد',
        quantity: lineQty,
        unitPrice: unitRial,
        discount: 0,
        tax: 0,
      },
    ],
  });
}

/**
 * Align Hesabfa stock with a target quantity by issuing a purchase invoice (delta > 0)
 * or purchase return invoice (delta < 0) vs current Hesabfa Stock.
 */
export async function syncHesabfaStockToTarget(input: {
  itemCode: string;
  itemName: string;
  targetStock: number;
  unitPriceToman: number;
  reference?: string;
}): Promise<void> {
  if (!(await isHesabfaConfigured())) return;

  const code = itemCodeOf(input.itemCode);
  if (!code) return;

  const item = await getItemByCode(code);
  const current = stockFromHesabfaItem(item);
  const delta = Math.round(input.targetStock) - current;
  if (delta === 0) return;

  await pushStockViaPurchaseInvoice({
    itemCode: code,
    itemName: input.itemName,
    quantity: delta,
    unitPriceToman: input.unitPriceToman,
    reference: input.reference,
  });
}
