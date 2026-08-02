/**
 * Two-way product sync between the local catalogue and Hesabfa items.
 */

import { revalidateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { tags } from '@/actions/cache-tags';
import {
  batchSaveItems,
  getAllItems,
  getItemByCode,
  getItemsById,
  isHesabfaConfigured,
  saveItem,
} from './client';
import { rialToToman, tomanToRial } from './currency';
import {
  HESABFA_ITEM_TYPE_PRODUCT,
  HESABFA_TAG,
  type HesabfaItem,
} from './types';

const FALLBACK_CATEGORY_KEY = 'uncategorized';
const FALLBACK_CATEGORY_NAME = 'دسته‌بندی نشده';
const FALLBACK_BRAND_NAME = 'نامشخص';
const FALLBACK_BRAND_SLUG = 'unknown';

export interface ProductSyncStats {
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  pushed: number;
  touchedIds: string[];
}

function codeOf(item: HesabfaItem): string {
  return item.Code != null ? String(item.Code).trim() : '';
}

function stockOf(n: number | null | undefined): number {
  return Math.max(0, Math.round(n ?? 0));
}

async function getFallbackCategoryId(): Promise<number> {
  const category = await prisma.category.upsert({
    where: { key: FALLBACK_CATEGORY_KEY },
    update: {},
    create: { key: FALLBACK_CATEGORY_KEY, name: FALLBACK_CATEGORY_NAME, sortOrder: 999 },
    select: { id: true },
  });
  return category.id;
}

async function getFallbackBrandId(): Promise<number> {
  const brand = await prisma.partsBrand.upsert({
    where: { name: FALLBACK_BRAND_NAME },
    update: {},
    create: { name: FALLBACK_BRAND_NAME, slug: FALLBACK_BRAND_SLUG },
    select: { id: true },
  });
  return brand.id;
}

/** Best-effort map of local category name/key → id (for NodeFamily leaf matching). */
async function buildCategoryMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const locals = await prisma.category.findMany({ select: { id: true, name: true, key: true } });
  for (const c of locals) {
    map.set(c.name.trim(), c.id);
    map.set(c.key.trim(), c.id);
  }
  return map;
}

/** Run async work over `items` with a fixed concurrency limit. */
async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  const limit = Math.max(1, concurrency);
  let next = 0;
  async function run(): Promise<void> {
    while (next < items.length) {
      const idx = next++;
      await worker(items[idx]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
}

function resolveCategoryId(
  nodeFamily: string | null | undefined,
  categoryMap: Map<string, number>,
  fallbackId: number,
): number {
  if (!nodeFamily) return fallbackId;
  const parts = nodeFamily
    .split(/[:：]/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const hit = categoryMap.get(parts[i]!);
    if (hit != null) return hit;
  }
  return fallbackId;
}

function invalidate(productIds: string[]): void {
  revalidateTag(tags.products, 'max');
  // Per-PDP tags only when the set is small (webhooks); full sync would spam thousands of calls.
  if (productIds.length > 0 && productIds.length <= 50) {
    for (const id of productIds) revalidateTag(tags.product(id), 'max');
  }
}

const UPDATE_CONCURRENCY = 25;
const CREATE_CHUNK = 100;

interface PreparedItem {
  code: string;
  name: string;
  wholesalePrice: bigint;
  stock: number;
  hesabfaId: number | undefined;
  active: boolean | null;
  nodeFamily: string | null | undefined;
  description: string | null;
}

/** Upsert Hesabfa items into the local Product table (pull). */
export async function syncProductsFromHesabfa(items: HesabfaItem[]): Promise<ProductSyncStats> {
  const stats: ProductSyncStats = {
    created: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    pushed: 0,
    touchedIds: [],
  };
  if (items.length === 0) return stats;

  // 1) Normalize + dedupe by code (last wins).
  const prepared = new Map<string, PreparedItem>();
  for (const item of items) {
    const code = codeOf(item);
    const name = item.Name?.trim();
    if (!code || !name) {
      stats.skipped++;
      continue;
    }
    prepared.set(code, {
      code,
      name,
      wholesalePrice: rialToToman(item.SellPrice),
      stock: stockOf(item.Stock),
      hesabfaId: typeof item.Id === 'number' ? item.Id : undefined,
      active: item.Active === true ? true : item.Active === false ? false : null,
      nodeFamily: item.NodeFamily,
      description: item.Description?.trim() || null,
    });
  }
  if (prepared.size === 0) return stats;

  const codes = [...prepared.keys()];
  const hesabfaIds = [...prepared.values()]
    .map((p) => p.hesabfaId)
    .filter((id): id is number => id != null);

  // 2) One prefetch instead of N findUnique round-trips.
  const existingRows = await prisma.product.findMany({
    where: {
      OR: [
        { hesabfaCode: { in: codes } },
        { sku: { in: codes } },
        ...(hesabfaIds.length > 0 ? [{ hesabfaId: { in: hesabfaIds } }] : []),
      ],
    },
    select: { id: true, hesabfaCode: true, hesabfaId: true, sku: true },
  });

  const byCode = new Map<string, string>();
  const byHesabfaId = new Map<number, string>();
  const bySku = new Map<string, string>();
  for (const row of existingRows) {
    if (row.hesabfaCode) byCode.set(row.hesabfaCode, row.id);
    if (row.hesabfaId != null) byHesabfaId.set(row.hesabfaId, row.id);
    bySku.set(row.sku, row.id);
  }

  function resolveExistingId(p: PreparedItem): string | undefined {
    return (
      byCode.get(p.code) ??
      (p.hesabfaId != null ? byHesabfaId.get(p.hesabfaId) : undefined) ??
      bySku.get(p.code)
    );
  }

  const toUpdate: Array<{ id: string; item: PreparedItem }> = [];
  const toCreate: PreparedItem[] = [];
  const claimedIds = new Set<string>();

  for (const item of prepared.values()) {
    const id = resolveExistingId(item);
    if (id && !claimedIds.has(id)) {
      claimedIds.add(id);
      toUpdate.push({ id, item });
    } else if (!id) {
      toCreate.push(item);
    } else {
      // Same local row matched by two Hesabfa codes — treat as update of first claim only.
      stats.skipped++;
    }
  }

  const now = new Date();

  // 3) Concurrent updates (bounded) instead of serial await.
  await mapPool(toUpdate, UPDATE_CONCURRENCY, async ({ id, item }) => {
    await prisma.product.update({
      where: { id },
      data: {
        name: item.name,
        wholesalePrice: item.wholesalePrice,
        stock: item.stock,
        hesabfaCode: item.code,
        ...(item.hesabfaId != null ? { hesabfaId: item.hesabfaId } : {}),
        lastSyncedAt: now,
        ...(item.active === false ? { isActive: false } : {}),
        ...(item.active === true ? { isActive: true } : {}),
      },
    });
  });
  stats.updated = toUpdate.length;
  stats.touchedIds.push(...toUpdate.map((u) => u.id));

  // 4) Bulk create for brand-new items.
  if (toCreate.length > 0) {
    const [fallbackCategoryId, fallbackBrandId, categoryMap] = await Promise.all([
      getFallbackCategoryId(),
      getFallbackBrandId(),
      buildCategoryMap(),
    ]);

    for (let i = 0; i < toCreate.length; i += CREATE_CHUNK) {
      const chunk = toCreate.slice(i, i + CREATE_CHUNK);
      await prisma.product.createMany({
        data: chunk.map((item) => ({
          sku: item.code,
          name: item.name,
          hesabfaCode: item.code,
          hesabfaId: item.hesabfaId ?? null,
          categoryId: resolveCategoryId(item.nodeFamily, categoryMap, fallbackCategoryId),
          partsBrandId: fallbackBrandId,
          wholesalePrice: item.wholesalePrice,
          stock: item.stock,
          lastSyncedAt: now,
          isActive: item.active === true,
          isOffer: false,
          mainImage: null,
          description: item.description,
          origin: null,
        })),
        skipDuplicates: true,
      });
    }

    const createdRows = await prisma.product.findMany({
      where: { hesabfaCode: { in: toCreate.map((c) => c.code) } },
      select: { id: true },
    });
    stats.created = createdRows.length;
    stats.touchedIds.push(...createdRows.map((r) => r.id));
  }

  invalidate(stats.touchedIds);
  return stats;
}

/** Soft-delete local products that vanished from Hesabfa (full sync). */
export async function reconcileDeletedProducts(liveCodes: Set<string>): Promise<string[]> {
  const synced = await prisma.product.findMany({
    where: { hesabfaCode: { not: null }, isActive: true },
    select: { id: true, hesabfaCode: true },
  });
  const orphanIds = synced
    .filter((p) => p.hesabfaCode && !liveCodes.has(p.hesabfaCode))
    .map((p) => p.id);

  if (orphanIds.length === 0) return [];

  await prisma.product.updateMany({
    where: { id: { in: orphanIds } },
    data: { isActive: false, lastSyncedAt: new Date() },
  });
  invalidate(orphanIds);
  return orphanIds;
}

/** Soft-delete local products by Hesabfa numeric Ids (webhook delete). */
export async function deleteProductsByHesabfaIds(ids: number[]): Promise<number> {
  if (ids.length === 0) return 0;
  const products = await prisma.product.findMany({
    where: { hesabfaId: { in: ids } },
    select: { id: true },
  });
  if (products.length === 0) return 0;
  const productIds = products.map((p) => p.id);
  await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { isActive: false, lastSyncedAt: new Date() },
  });
  invalidate(productIds);
  return productIds.length;
}

export async function syncProductsByIds(ids: number[]): Promise<ProductSyncStats> {
  const items = await getItemsById(ids);
  return syncProductsFromHesabfa(items);
}

export async function fullSyncProducts(): Promise<ProductSyncStats> {
  const items = await getAllItems();
  const stats = await syncProductsFromHesabfa(items);
  const liveCodes = new Set(items.map(codeOf).filter(Boolean));
  const deletedIds = await reconcileDeletedProducts(liveCodes);
  stats.deleted = deletedIds.length;
  stats.touchedIds.push(...deletedIds);
  return stats;
}

function toHesabfaItemPayload(product: {
  hesabfaCode: string | null;
  sku: string;
  name: string;
  wholesalePrice: bigint;
  stock: number;
  isActive: boolean;
  description: string | null;
  category: { name: string };
}): Record<string, unknown> {
  const code = product.hesabfaCode?.trim() || product.sku.trim();
  return {
    ...(product.hesabfaCode ? { code: product.hesabfaCode } : { code }),
    name: product.name,
    itemType: HESABFA_ITEM_TYPE_PRODUCT,
    unit: 'عدد',
    sellPrice: tomanToRial(product.wholesalePrice),
    productCode: product.sku,
    active: product.isActive,
    description: product.description ?? '',
    tag: HESABFA_TAG,
    nodeFamily: `کالاها:${product.category.name}`,
  };
}

/** Push one local product to Hesabfa immediately (create/update). */
export async function pushProductToHesabfa(productId: string): Promise<void> {
  if (!isHesabfaConfigured()) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: { select: { name: true } } },
  });
  if (!product) return;

  const payload = toHesabfaItemPayload(product);
  let saved: HesabfaItem;

  if (product.hesabfaCode) {
    const existing = await getItemByCode(product.hesabfaCode);
    if (existing) {
      saved = await saveItem({ ...payload, code: product.hesabfaCode });
    } else {
      saved = await saveItem(payload);
    }
  } else {
    saved = await saveItem(payload);
  }

  const code = codeOf(saved);
  await prisma.product.update({
    where: { id: productId },
    data: {
      hesabfaCode: code || product.sku,
      hesabfaId: typeof saved.Id === 'number' ? saved.Id : product.hesabfaId,
      lastSyncedAt: new Date(),
    },
  });
}


