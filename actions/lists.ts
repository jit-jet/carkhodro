'use server';

/**
 * Wishlist & Compare-list Server Actions.
 * ───────────────────────────────────────
 * Both lists are per-user bookmarks, stored in their own tables (`wishlist_items`
 * / `compare_items`) and kept completely separate from the cart. Every action
 * resolves the actor from the session cookie → request-time (dynamic) data,
 * never cached.
 *
 * AUTH: unlike the cart, these require a signed-in user (the schema stores them
 * per `userId`). Guests get a friendly "please log in" failure the UI surfaces;
 * no guest cookie fallback. The unique `(userId, productId)` constraint makes
 * add idempotent and remove a safe no-op.
 *
 * The buttons across the app don't call the per-product read on mount — instead
 * the whole membership set is hydrated once via `getListItemIds` into a client
 * store (see `src/store/lists-ui`), so product cards/PDP stay cached and there's
 * no N+1. `getWishlist` / `getCompareList` return full product view-models for
 * dedicated list pages.
 */

import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { productInclude, toProductVM, type ProductVM } from '@/src/lib/serializers';
import { COMPARE_LIMIT } from '@/src/lib/lists';

const LOGIN_REQUIRED = 'برای استفاده از این قابلیت ابتدا وارد شوید.';
const PRODUCT_NOT_FOUND = 'محصول یافت نشد.';

// ── Hydration read (ids only — cheap, one round-trip per list) ───────────────

/**
 * The product ids in the current user's wishlist and compare list. Returns empty
 * arrays for guests. Used once on the client to seed the shared lists store so
 * every wishlist/compare button can reflect state without its own query.
 */
export async function getListItemIds(): Promise<{ wishlist: string[]; compare: string[] }> {
  const user = await getCurrentUser();
  if (!user) return { wishlist: [], compare: [] };

  return safeQuery(
    'getListItemIds',
    async () => {
      const [wishlist, compare] = await Promise.all([
        prisma.wishlistItem.findMany({
          where: { userId: user.id },
          select: { productId: true },
        }),
        prisma.compareItem.findMany({
          where: { userId: user.id },
          select: { productId: true },
        }),
      ]);
      return {
        wishlist: wishlist.map((w) => w.productId),
        compare: compare.map((c) => c.productId),
      };
    },
    { wishlist: [], compare: [] },
  );
}

// ── Wishlist mutations ───────────────────────────────────────────────────────

export async function addToWishlist(
  productId: string,
): Promise<ActionResult<{ inWishlist: boolean }>> {
  return runMutation('addToWishlist', async () => {
    const user = await getCurrentUser();
    if (!user) return fail(LOGIN_REQUIRED);

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!product) return fail(PRODUCT_NOT_FOUND);

    // Idempotent: re-adding an existing item is a no-op (unique userId+productId).
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId },
      update: {},
    });
    return ok({ inWishlist: true });
  });
}

export async function removeFromWishlist(
  productId: string,
): Promise<ActionResult<{ inWishlist: boolean }>> {
  return runMutation('removeFromWishlist', async () => {
    const user = await getCurrentUser();
    if (!user) return fail(LOGIN_REQUIRED);

    await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
    return ok({ inWishlist: false });
  });
}

// ── Compare mutations ────────────────────────────────────────────────────────

export async function addToCompare(
  productId: string,
): Promise<ActionResult<{ inCompare: boolean; count: number }>> {
  return runMutation('addToCompare', async () => {
    const user = await getCurrentUser();
    if (!user) return fail(LOGIN_REQUIRED);

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!product) return fail(PRODUCT_NOT_FOUND);

    const existing = await prisma.compareItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
      select: { id: true },
    });
    const count = await prisma.compareItem.count({ where: { userId: user.id } });

    // Already present → idempotent success (don't count it against the limit).
    if (existing) return ok({ inCompare: true, count });

    if (count >= COMPARE_LIMIT) {
      return fail(
        `حداکثر ${COMPARE_LIMIT.toLocaleString('fa-IR')} محصول را می‌توانید همزمان مقایسه کنید.`,
      );
    }

    await prisma.compareItem.create({ data: { userId: user.id, productId } });
    return ok({ inCompare: true, count: count + 1 });
  });
}

export async function removeFromCompare(
  productId: string,
): Promise<ActionResult<{ inCompare: boolean; count: number }>> {
  return runMutation('removeFromCompare', async () => {
    const user = await getCurrentUser();
    if (!user) return fail(LOGIN_REQUIRED);

    await prisma.compareItem.deleteMany({ where: { userId: user.id, productId } });
    const count = await prisma.compareItem.count({ where: { userId: user.id } });
    return ok({ inCompare: false, count });
  });
}

// ── Full-list reads (for dedicated wishlist / compare pages) ─────────────────

export async function getWishlist(): Promise<ProductVM[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  return safeQuery(
    'getWishlist',
    async () => {
      const rows = await prisma.wishlistItem.findMany({
        where: { userId: user.id, product: { isActive: true } },
        orderBy: { createdAt: 'desc' },
        include: { product: { include: productInclude } },
      });
      return rows.map((r) => toProductVM(r.product));
    },
    [],
  );
}

export async function getCompareList(): Promise<ProductVM[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  return safeQuery(
    'getCompareList',
    async () => {
      const rows = await prisma.compareItem.findMany({
        where: { userId: user.id, product: { isActive: true } },
        orderBy: { createdAt: 'desc' },
        include: { product: { include: productInclude } },
      });
      return rows.map((r) => toProductVM(r.product));
    },
    [],
  );
}
