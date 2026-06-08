/**
 * Search Server Actions.
 *
 * Kept in its own `'use server'` module (separate from `actions/products.ts`,
 * which mixes in `'use cache'` reads) so Client Components can import the live
 * search action without pulling cached functions into the client bundle.
 */

'use server';

import { prisma } from '@/src/lib/prisma';
import { productInclude, toProductVM, type ProductVM } from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';

/**
 * Live search for the header search box. Matches the query against product
 * name, SKU, and parts-brand name (case-insensitive) and returns a small,
 * sales-ranked slice for the autocomplete dropdown.
 *
 * Not cached: the query string is unbounded, so per-keystroke results would
 * pollute the cache. The `take` cap keeps each lookup cheap.
 */
export async function searchProducts(query: string, limit = 8): Promise<ProductVM[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  return safeQuery(`searchProducts:${q}`, async () => {
    const rows = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { partsBrand: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: productInclude,
      orderBy: { saleCount: 'desc' },
      take: limit,
    });
    return rows.map(toProductVM);
  }, []);
}
