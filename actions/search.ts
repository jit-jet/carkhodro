/**
 * Search Server Actions.
 *
 * Kept in its own `'use server'` module (separate from `actions/products.ts`,
 * which mixes in `'use cache'` reads) so Client Components can import the live
 * search action without pulling cached functions into the client bundle.
 */

'use server';

import { Prisma } from '@/generated/prisma_client';
import { prisma } from '@/src/lib/prisma';
import { productInclude, toProductVM, type ProductVM } from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';
import { normalizePersianText } from '@/src/lib/persian';
import { getCurrentUser } from '@/src/lib/session';
import { pricingRoleFromUser } from '@/src/lib/user-role';

/**
 * Trigram word-similarity threshold used by the `%>` operator (default 0.6).
 * Lowered for recall so misspellings still match. Tune up for tighter results.
 */
const WORD_SIMILARITY_THRESHOLD = 0.3;

/** Hard cap on candidate rows scored by the DB before view-model hydration. */
const MAX_RESULTS = 200;

/**
 * Typo-tolerant fuzzy search over the denormalized `search_text` document
 * (name, sku, parts-brand, category and compatible car models).
 *
 * The query is normalized and split into tokens; a product matches if *any*
 * token is trigram-word-similar to its document, and rows are ranked by the
 * summed word-similarity across all tokens. This handles, in one pass:
 *   • misspellings           → trigram similarity is fuzzy by nature
 *   • merged / spaced words  → normalization + trigrams are spacing-agnostic
 *   • multi-word queries     → per-token scoring rewards matching more tokens
 *   • out-of-order words     → each token is matched independently of position
 *
 * Not cached: the query string is unbounded, so per-keystroke results would
 * pollute the cache. The `limit`/MAX_RESULTS caps keep each lookup cheap.
 */
export async function searchProducts(query: string, limit = 8): Promise<ProductVM[]> {
  const normalized = normalizePersianText(query);
  if (normalized.length < 2) return [];

  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length === 0) return [];

  const take = Math.min(Math.max(limit, 1), MAX_RESULTS);

  return safeQuery(`searchProducts:${normalized}`, async () => {
    // Each token contributes an OR-able, index-usable match condition and a
    // word-similarity term; ranking sums the terms so closer / more-complete
    // matches float to the top.
    const conditions = Prisma.join(
      tokens.map((t) => Prisma.sql`p.search_text %> ${t}`),
      ' OR ',
    );
    const score = Prisma.join(
      tokens.map((t) => Prisma.sql`word_similarity(${t}, p.search_text)`),
      ' + ',
    );

    // SET LOCAL keeps the looser threshold scoped to this transaction.
    const ranked = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL pg_trgm.word_similarity_threshold = ${WORD_SIMILARITY_THRESHOLD}`,
      );
      return tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT p.id
        FROM products p
        WHERE p.is_active = true AND (${conditions})
        ORDER BY (${score}) DESC, p.sale_count DESC
        LIMIT ${take}
      `);
    });

    const ids = ranked.map((r) => r.id);
    if (ids.length === 0) return [];

    // Hydrate full rows, then re-apply the DB ranking (findMany ignores it).
    const rows = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: productInclude,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const user = await getCurrentUser();
    const role = pricingRoleFromUser(user?.role);
    return ids
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => r != null)
      .map((r) => toProductVM(r, role));
  }, []);
}
