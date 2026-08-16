/**
 * Two-way product sync between the local catalogue and Hesabfa items.
 */

import { revalidateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { tags } from '@/actions/cache-tags';
import { deleteFile } from '@/src/lib/storage';
import {
  deleteItem,
  getAllItems,
  getItemByCode,
  getItemsById,
  HesabfaError,
  isHesabfaConfigured,
  saveItem,
} from './client';
import {
  FALLBACK_CATEGORY_KEY,
  FALLBACK_CATEGORY_NAME,
  syncCategoriesFromHesabfa,
} from './categories';
import { topCategoryNameFromNodeFamily } from './category-path';
import { rialToToman, tomanToRial } from './currency';
import { stockFromHesabfaItem } from './stock';
import { planProductIdentitySync } from './product-identity';
import { computeRetailPrice, computeWholesaleFinal } from '@/src/lib/pricing';
import {
  HESABFA_ITEM_TYPE_PRODUCT,
  HESABFA_TAG,
  type HesabfaItem,
} from './types';

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

/** Prefer PriceList «عمده» / «همکار» / «کلی فروشی»; fall back to SellPrice. */
function wholesaleFromItem(item: HesabfaItem): bigint {
  const list = item.PriceList ?? [];
  const titles = new Set(['عمده', 'همکار', 'کلی فروشی']);
  const entry = list.find((e) => titles.has((e.Title ?? e.title ?? '').trim()));
  const price = entry?.Price ?? entry?.price;
  if (price != null && Number(price) > 0) return rialToToman(price);
  return rialToToman(item.SellPrice);
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

/**
 * Map product NodeFamily → local category id.
 * Uses the top-level category only (first segment after «کالا»/«کالاها»).
 * Missing / unknown → «دسته‌بندی نشده».
 */
function resolveCategoryId(
  nodeFamily: string | null | undefined,
  categoryMap: Map<string, number>,
  fallbackId: number,
): number {
  const top = topCategoryNameFromNodeFamily(nodeFamily);
  if (!top) return fallbackId;
  return categoryMap.get(top) ?? fallbackId;
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
  buyPrice: bigint | null;
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

  // Ensure Hesabfa categories exist locally before resolving NodeFamily → categoryId.
  try {
    await syncCategoriesFromHesabfa();
  } catch (err) {
    console.error('[hesabfa:syncCategories]', err);
  }

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
      wholesalePrice: wholesaleFromItem(item),
      buyPrice: item.BuyPrice != null && item.BuyPrice > 0 ? rialToToman(item.BuyPrice) : null,
      stock: stockFromHesabfaItem(item),
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

  const identityPlan = planProductIdentitySync([...prepared.values()], existingRows);
  const { toUpdate, toCreate, hesabfaIdsToRelease } = identityPlan;
  stats.skipped += identityPlan.skipped;

  const now = new Date();
  const [fallbackCategoryId, categoryMap] = await Promise.all([
    getFallbackCategoryId(),
    buildCategoryMap(),
  ]);

  // Hesabfa can recycle a deleted item's numeric Id. Release stale owners
  // before assigning those Ids to the current code owners, otherwise the
  // unique `hesabfa_id` constraint aborts the entire sync with P2002.
  if (hesabfaIdsToRelease.length > 0) {
    await prisma.$transaction(
      hesabfaIdsToRelease.map(({ productId, hesabfaId }) =>
        prisma.product.updateMany({
          where: { id: productId, hesabfaId },
          data: { hesabfaId: null },
        }),
      ),
    );
  }

  // 3) Concurrent updates (bounded) — including category from NodeFamily.
  await mapPool(toUpdate, UPDATE_CONCURRENCY, async ({ id, item }) => {
    await prisma.product.update({
      where: { id },
      data: {
        name: item.name,
        wholesalePrice: item.wholesalePrice,
        buyPrice: item.buyPrice,
        stock: item.stock,
        categoryId: resolveCategoryId(item.nodeFamily, categoryMap, fallbackCategoryId),
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
    const fallbackBrandId = await getFallbackBrandId();

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
          buyPrice: item.buyPrice,
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

async function hardDeleteLocalProducts(
  products: Array<{
    id: string;
    mainImage: string | null;
    images: Array<{ url: string }>;
  }>,
): Promise<string[]> {
  if (products.length === 0) return [];

  const productIds = products.map((product) => product.id);
  const imageUrls = [
    ...new Set(
      products.flatMap((product) => [
        product.mainImage,
        ...product.images.map((image) => image.url),
      ]).filter((url): url is string => Boolean(url)),
    ),
  ];

  await prisma.product.deleteMany({ where: { id: { in: productIds } } });

  const fileResults = await Promise.allSettled(imageUrls.map((url) => deleteFile(url)));
  for (const result of fileResults) {
    if (result.status === 'rejected') {
      console.error('[hesabfa:product:file-delete]', result.reason);
    }
  }

  invalidate(productIds);
  return productIds;
}

/** Hard-delete local products that no longer exist in Hesabfa (full sync). */
export async function reconcileDeletedProducts(liveCodes: Set<string>): Promise<string[]> {
  const localProducts = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      hesabfaCode: true,
      mainImage: true,
      images: { select: { url: true } },
    },
  });
  const removed = localProducts.filter((product) => {
    const code = product.hesabfaCode?.trim() || product.sku.trim();
    return !code || !liveCodes.has(code);
  });
  return hardDeleteLocalProducts(removed);
}

/** Hard-delete local products by Hesabfa numeric Ids (webhook delete). */
export async function deleteProductsByHesabfaIds(ids: number[]): Promise<number> {
  if (ids.length === 0) return 0;
  const products = await prisma.product.findMany({
    where: { hesabfaId: { in: ids } },
    select: {
      id: true,
      mainImage: true,
      images: { select: { url: true } },
    },
  });
  return (await hardDeleteLocalProducts(products)).length;
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

export interface HesabfaProductPayloadInput {
  /** Empty string for new items so Hesabfa generates the code. */
  code: string;
  name: string;
  categoryName: string;
  wholesalePrice: bigint | number;
  retailPriceDiffPct?: number | string;
  retailDiscountPct?: number | string;
  wholesaleDiscountPct?: number | string;
  /** Optional buy/cost price in Toman. */
  buyPrice?: bigint | number | null;
  description?: string | null;
  active?: boolean;
}

/** Build the Hesabfa `item/save` body (amounts converted Toman → Rial). */
export function toHesabfaItemPayload(input: HesabfaProductPayloadInput): Record<string, unknown> {
  const priceFields = {
    wholesalePrice: Number(input.wholesalePrice),
    wholesaleDiscountPct: Number(input.wholesaleDiscountPct ?? 0),
    retailPriceDiffPct: Number(input.retailPriceDiffPct ?? 25),
    retailDiscountPct: Number(input.retailDiscountPct ?? 0),
  };
  // «قیمت کلی فروشی» — base wholesale / seller price entered in admin.
  const wholesale = priceFields.wholesalePrice;
  const wholesaleFinal = computeWholesaleFinal(priceFields);
  const retailPrice = computeRetailPrice(priceFields);
  const buy =
    input.buyPrice != null && Number(input.buyPrice) > 0 ? Number(input.buyPrice) : null;

  return {
    code: input.code,
    name: input.name,
    itemType: HESABFA_ITEM_TYPE_PRODUCT,
    buyPrice: buy != null ? tomanToRial(buy) : 0,
    // Main Hesabfa SellPrice = wholesale (کلی فروشی) so it shows on the item form.
    sellPrice: tomanToRial(wholesale),
    active: input.active ?? true,
    description: input.description ?? '',
    tag: HESABFA_TAG,
    nodeFamily: `کالاها : ${input.categoryName}`,
    priceList: [
      {
        title: 'عمده',
        currency: 'IRR',
        price: tomanToRial(wholesale),
      },
      {
        title: 'همکار',
        currency: 'IRR',
        price: tomanToRial(wholesaleFinal),
      },
      {
        title: 'تک فروشی',
        currency: 'IRR',
        price: tomanToRial(retailPrice),
      },
    ],
  };
}

export function formatHesabfaSaveError(err: unknown): string {
  const reason =
    err instanceof HesabfaError
      ? err.message
      : err instanceof Error
        ? err.message
        : 'Unknown error';
  return `Saving product to Hesabfa failed. Please try again. ${reason}`;
}

export function formatHesabfaDeleteError(err: unknown): string {
  const reason = err instanceof Error ? err.message : 'Unknown error';
  return `Deleting product from Hesabfa failed. Please try again. ${reason}`;
}

/** Delete a product item from Hesabfa by its accounting code. */
export async function deleteProductFromHesabfa(code: string): Promise<void> {
  if (!(await isHesabfaConfigured())) {
    throw new HesabfaError('Hesabfa is not configured in System Settings.');
  }
  const normalizedCode = code.trim();
  if (!normalizedCode) throw new HesabfaError('Product has no Hesabfa item code.');
  await deleteItem(normalizedCode);
}

/**
 * Save (create or update) an item in Hesabfa and return the API result.
 * Pass `code: ""` to let Hesabfa generate a new item code.
 */
export async function saveProductItemToHesabfa(
  input: HesabfaProductPayloadInput,
): Promise<HesabfaItem> {
  if (!(await isHesabfaConfigured())) {
    throw new HesabfaError(
      'Hesabfa is not configured in System Settings.',
    );
  }
  return saveItem(toHesabfaItemPayload(input));
}

/** Push one local product to Hesabfa immediately (create/update). */
export async function pushProductToHesabfa(productId: string): Promise<void> {
  if (!(await isHesabfaConfigured())) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: { select: { name: true } } },
  });
  if (!product) return;

  const existingCode = product.hesabfaCode?.trim() || '';
  let code = existingCode;
  if (!code) {
    const sku = product.sku.trim();
    if (sku) {
      const existing = await getItemByCode(sku);
      if (existing) code = sku;
    }
  }

  const saved = await saveProductItemToHesabfa({
    code,
    name: product.name,
    categoryName: product.category.name,
    wholesalePrice: product.wholesalePrice,
    retailPriceDiffPct: Number(product.retailPriceDiffPct),
    retailDiscountPct: Number(product.retailDiscountPct),
    wholesaleDiscountPct: Number(product.wholesaleDiscountPct),
    buyPrice: product.buyPrice,
    description: product.description,
    active: product.isActive,
  });

  const savedCode = codeOf(saved);
  await prisma.product.update({
    where: { id: productId },
    data: {
      ...(savedCode
        ? {
            hesabfaCode: savedCode,
            ...(!existingCode ? { sku: savedCode } : {}),
          }
        : {}),
      hesabfaId: typeof saved.Id === 'number' ? saved.Id : product.hesabfaId,
      lastSyncedAt: new Date(),
    },
  });
}
