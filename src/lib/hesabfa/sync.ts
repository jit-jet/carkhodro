/**
 * Hesabfa → local catalogue sync.
 * ───────────────────────────────
 * The shared heart of the integration, called from BOTH the webhook Route
 * Handler (real-time, a handful of items) and the manual force-sync Server
 * Action (full reconciliation). Keeping the upsert logic here means both paths
 * map fields and invalidate caches identically.
 *
 * Mapping rules:
 *   • Match an incoming item to a local Product by `accountancyId` (the Hesabfa
 *     `Code`); failing that, by `sku` (a product created locally that is still
 *     awaiting its first link to the books). Otherwise create a new product.
 *   • Hesabfa owns price, stock and name; we copy those on every sync.
 *   • Fields Hesabfa has no concept of (images, SEO, rich description, category,
 *     parts brand, origin…) are left untouched on update and set to
 *     safe empty/default values on create. New products are created INACTIVE so
 *     they never go live with a placeholder category until an admin completes
 *     them — matching the schema's "must not go live until populated" rule.
 *
 * Cache: after any write we `revalidateTag` the catalogue (and each touched
 * product) so the storefront reflects the new prices/stock. `revalidateTag`
 * works in both Server Actions and Route Handlers, unlike `updateTag`.
 */

import { revalidateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { tags } from '@/actions/cache-tags';
import { getAllItems, getItemsById } from './client';
import type { HesabfaItem } from './types';

// Fallback taxonomy for freshly-imported items that have no local mapping yet.
const FALLBACK_CATEGORY_KEY = 'uncategorized';
const FALLBACK_CATEGORY_NAME = 'دسته‌بندی نشده';
const FALLBACK_BRAND_NAME = 'نامشخص';

export interface SyncStats {
  created: number;
  updated: number;
  /** Items skipped because they lacked a usable Code/Name. */
  skipped: number;
  /** Local product ids that were created or updated (for cache invalidation). */
  touchedIds: string[];
}

export interface FullSyncSummary {
  created: number;
  updated: number;
  skipped: number;
  /** Local products deactivated because they vanished from Hesabfa. */
  deactivated: number;
  /** Total items pulled from Hesabfa. */
  total: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Coerce a Hesabfa price to a non-negative BigInt (the schema's money type). */
function toPrice(n: number | null | undefined): bigint {
  return BigInt(Math.max(0, Math.round(n ?? 0)));
}

function toStock(n: number | null | undefined): number {
  return Math.max(0, Math.round(n ?? 0));
}

/** Find-or-create the placeholder category newly-imported items are filed under. */
async function getFallbackCategoryId(): Promise<number> {
  const category = await prisma.category.upsert({
    where: { key: FALLBACK_CATEGORY_KEY },
    update: {},
    create: { key: FALLBACK_CATEGORY_KEY, name: FALLBACK_CATEGORY_NAME, sortOrder: 999 },
    select: { id: true },
  });
  return category.id;
}

/** Find-or-create the placeholder parts brand for newly-imported items. */
async function getFallbackBrandId(): Promise<number> {
  const brand = await prisma.partsBrand.upsert({
    where: { name: FALLBACK_BRAND_NAME },
    update: {},
    create: { name: FALLBACK_BRAND_NAME },
    select: { id: true },
  });
  return brand.id;
}

// ── Core upsert ───────────────────────────────────────────────────────────────

/**
 * Upsert a batch of Hesabfa items into the local catalogue and invalidate the
 * affected caches. Returns per-item stats. Safe to call with an empty array.
 */
export async function syncHesabfaItems(items: HesabfaItem[]): Promise<SyncStats> {
  const stats: SyncStats = { created: 0, updated: 0, skipped: 0, touchedIds: [] };
  if (items.length === 0) return stats;

  // Resolved once and reused — only needed if we end up creating products.
  let fallbackCategoryId: number | null = null;
  let fallbackBrandId: number | null = null;

  for (const item of items) {
    const code = item.Code != null ? String(item.Code).trim() : '';
    const name = item.Name?.trim();
    if (!code || !name) {
      stats.skipped++;
      continue;
    }

    const wholesalePrice = toPrice(item.SellPrice);
    const stock = toStock(item.Stock);

    // Match by accounting code first, then by SKU (locally-seeded, unlinked).
    const existing =
      (await prisma.product.findUnique({
        where: { accountancyId: code },
        select: { id: true },
      })) ??
      (await prisma.product.findUnique({
        where: { sku: code },
        select: { id: true },
      }));

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        // Only the Hesabfa-owned fields; local content is preserved.
        data: { name, wholesalePrice, stock, accountancyId: code, lastSyncedAt: new Date() },
      });
      stats.updated++;
      stats.touchedIds.push(existing.id);
      continue;
    }

    // New item → import it, defaulting every e-commerce-only field.
    if (fallbackCategoryId === null || fallbackBrandId === null) {
      [fallbackCategoryId, fallbackBrandId] = await Promise.all([
        getFallbackCategoryId(),
        getFallbackBrandId(),
      ]);
    }

    const created = await prisma.product.create({
      data: {
        sku: code,
        name,
        accountancyId: code,
        categoryId: fallbackCategoryId,
        partsBrandId: fallbackBrandId,
        wholesalePrice,
        stock,
        lastSyncedAt: new Date(),
        isActive: item.Active === true,
        // Fields Hesabfa does not provide — explicit safe defaults.
        isOffer: false,
        mainImage: null,
        description: null,
        origin: null,
      },
      select: { id: true },
    });
    stats.created++;
    stats.touchedIds.push(created.id);
  }

  invalidate(stats.touchedIds);
  return stats;
}

/**
 * Full reconciliation: pull every item from Hesabfa, upsert them all, then
 * deactivate any previously-synced local product whose code no longer exists in
 * Hesabfa (deleted upstream). This is the fallback that recovers from any
 * webhooks that were missed while the app was down.
 */
export async function fullSyncHesabfa(): Promise<FullSyncSummary> {
  const items = await getAllItems(); 
  const stats = await syncHesabfaItems(items);

  // Reconcile deletions: active, previously-synced products absent upstream.
  const liveCodes = new Set(
    items.map((i) => (i.Code != null ? String(i.Code).trim() : '')).filter(Boolean),
  );
  const synced = await prisma.product.findMany({
    where: { accountancyId: { not: null }, isActive: true },
    select: { id: true, accountancyId: true },
  });
  const orphanIds = synced
    .filter((p) => p.accountancyId && !liveCodes.has(p.accountancyId))
    .map((p) => p.id);

  let deactivated = 0;
  if (orphanIds.length > 0) {
    const { count } = await prisma.product.updateMany({
      where: { id: { in: orphanIds } },
      data: { isActive: false },
    });
    deactivated = count;
    invalidate(orphanIds);
  }

  return {
    created: stats.created,
    updated: stats.updated,
    skipped: stats.skipped,
    deactivated,
    total: items.length,
  };
}

/**
 * Webhook entry point: resolve the changed Hesabfa `Id`s to current item data
 * and upsert them. (Upstream deletions are reconciled by the full sync, since a
 * deleted `Id` carries no `Code` we could map back to a local product.)
 */
export async function syncHesabfaByIds(ids: number[]): Promise<SyncStats> {
  const items = await getItemsById(ids);
  return syncHesabfaItems(items);
}

// ── Cache invalidation ──────────────────────────────────────────────────────

function invalidate(productIds: string[]): void {
  // `'max'` → stale-while-revalidate: the storefront keeps serving the last
  // good page while the fresh price/stock regenerates in the background.
  // The catalogue listings (PLP, sliders, filters) all share this tag.
  revalidateTag(tags.products, 'max');
  // Plus each affected PDP, tagged per-id.
  for (const id of productIds) revalidateTag(tags.product(id), 'max');
}
