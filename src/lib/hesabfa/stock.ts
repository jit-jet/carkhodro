/**
 * Hesabfa stock helpers — read `Stock` from item/get and persist it locally.
 */

import { revalidateTag } from 'next/cache';
import { tags } from '@/actions/cache-tags';
import { prisma } from '@/src/lib/prisma';
import {
  getItemByCode,
  getItemQuantities,
  isHesabfaConfigured,
} from './client';
import {
  type HesabfaItem,
  type HesabfaItemQuantity,
} from './types';

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

/** Parse inventory from item/get* — uses `Stock` only. */
export function stockFromHesabfaItem(item: Pick<HesabfaItem, 'Stock'> | null | undefined): number {
  return Math.max(0, Math.round(item?.Stock ?? 0));
}

/** Use item/get for one code and item/GetQuantity for a code list. */
export async function fetchHesabfaStockByCodes(
  codes: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!(await isHesabfaConfigured())) return map;

  const unique = [...new Set(codes.map((c) => c.trim()).filter(Boolean))];
  if (unique.length === 0) return map;

  try {
    if (unique.length === 1) {
      const item = await getItemByCode(unique[0]!);
      if (item) map.set(unique[0]!, stockFromHesabfaItem(item));
      return map;
    }

    for (const item of await getItemQuantities(unique)) {
      const code = item.Code != null ? String(item.Code).trim() : '';
      if (code) map.set(code, Math.max(0, Math.round(item.Quantity ?? 0)));
    }
  } catch (err) {
    console.error('[hesabfa:stock:get]', unique, err);
  }
  return map;
}

function invalidateStock(productIds: string[]): void {
  if (productIds.length === 0) return;
  revalidateTag(tags.products, 'max');
  if (productIds.length <= 50) {
    for (const id of productIds) revalidateTag(tags.product(id), 'max');
  }
}

async function persistStockByCode(stockByCode: Map<string, number>): Promise<number> {
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

async function persistStockQuantities(items: HesabfaItemQuantity[]): Promise<number> {
  const stockByCode = new Map<string, number>();
  for (const item of items) {
    const code = item.Code != null ? String(item.Code).trim() : '';
    if (code) stockByCode.set(code, Math.max(0, Math.round(item.Quantity ?? 0)));
  }
  return persistStockByCode(stockByCode);
}

/** Refresh local stock by item codes extracted from changed invoices. */
export async function refreshLocalStockFromHesabfaCodes(codes: string[]): Promise<number> {
  if (!(await isHesabfaConfigured())) return 0;
  return persistStockByCode(await fetchHesabfaStockByCodes(codes));
}

/** Deleted invoices have no retrievable lines, so refresh all item stocks. */
export async function refreshAllLocalStockFromHesabfa(): Promise<number> {
  if (!(await isHesabfaConfigured())) return 0;
  return persistStockQuantities(await getItemQuantities());
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
