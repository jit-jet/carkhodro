'use server';

/**
 * Price-list Server Actions («دریافت لیست قیمت»).
 * ────────────────────────────────────────────────
 * The partner picks optional product-name titles, parts-brand and car-model
 * filters; we snapshot the filter as a `PriceListRequest` valid for ~24h and
 * resolve it to a concrete, printable list of parts + prices (downloaded as PDF
 * via the browser's print dialog on the request page).
 *
 * The title filter uses the same normalized pg_trgm document as storefront
 * search, but returns a complete alphabetic list instead of a small ranked set.
 *
 * Per-user / dynamic — never cached.
 */

import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { formatJalaliDateTime } from '@/src/lib/format';
import { resolveProductPrice } from '@/src/lib/pricing';
import { pricingFieldsFromProduct } from '@/src/lib/serializers';
import { pricingRoleFromUser } from '@/src/lib/user-role';
import { normalizePersianText } from '@/src/lib/persian';
import { Prisma } from '@/generated/prisma_client';
import type { PriceListRequestVM, PriceListItemVM } from '@/src/lib/dashboard-types';

/** Hours a generated price list stays valid before it must be regenerated. */
const VALID_HOURS = 24;
/** Cap on rows in one list — keeps the printable file small, as the UI notes. */
const MAX_ITEMS = 1000;
/** Recall-oriented threshold: low enough for common one-letter Persian typos. */
const WORD_SIMILARITY_THRESHOLD = 0.3;

export interface PriceListFilterInput {
  titles: string[];
  partsBrandIds: number[];
  carModelIds: number[];
}

export async function createPriceListRequest(
  input: PriceListFilterInput,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('createPriceListRequest', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای دریافت لیست قیمت وارد شوید.');

    const titles = (input.titles ?? [])
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 20);
    const partsBrandIds = [...new Set((input.partsBrandIds ?? []).filter(Number.isFinite))];
    const carModelIds = [...new Set((input.carModelIds ?? []).filter(Number.isFinite))];

    const created = await prisma.priceListRequest.create({
      data: {
        userId: user.id,
        titles,
        partsBrandIds,
        carModelIds,
        expiresAt: new Date(Date.now() + VALID_HOURS * 60 * 60 * 1000),
      },
      select: { id: true },
    });
    return ok(created);
  });
}

const itemSelect = {
  sku: true,
  name: true,
  wholesalePrice: true,
  wholesaleDiscountPct: true,
  retailPriceDiffPct: true,
  retailDiscountPct: true,
  partsBrand: { select: { name: true } },
  compatibilities: {
    take: 1,
    select: { carModel: { select: { name: true } } },
  },
} satisfies Prisma.ProductSelect;

/** Resolve a saved request to its concrete, ordered list of parts + prices. */
export async function getPriceListRequest(id: string): Promise<PriceListRequestVM | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return safeQuery(
    `getPriceListRequest:${id}`,
    async () => {
      const request = await prisma.priceListRequest.findFirst({
        where: { id, userId: user.id },
      });
      if (!request) return null;

      const where: Prisma.ProductWhereInput = { isActive: true };
      if (request.partsBrandIds.length > 0) {
        where.partsBrandId = { in: request.partsBrandIds };
      }
      if (request.carModelIds.length > 0) {
        where.compatibilities = { some: { carModelId: { in: request.carModelIds } } };
      }
      if (request.titles.length > 0) {
        const titles = request.titles.map(normalizePersianText).filter(Boolean);
        if (titles.length === 0) {
          where.id = { in: [] };
        } else {
          const titleConditions = Prisma.join(
            titles.map((title) => {
              const compact = title.replaceAll(' ', '');
              const tokens = title.split(' ').filter(Boolean);
              const fuzzyTokens = Prisma.join(
                tokens.map((token) => Prisma.sql`p.search_text %> ${token}`),
                ' AND ',
              );
              const alternatives = [
                Prisma.sql`p.search_text LIKE ${`%${title}%`}`,
                Prisma.sql`p.search_text LIKE ${`%${compact}%`}`,
                Prisma.sql`(${fuzzyTokens})`,
              ];
              return Prisma.sql`(${Prisma.join(alternatives, ' OR ')})`;
            }),
            ' OR ',
          );

          const rawFilters: Prisma.Sql[] = [
            Prisma.sql`p.is_active = true`,
            Prisma.sql`(${titleConditions})`,
          ];
          if (request.partsBrandIds.length > 0) {
            rawFilters.push(
              Prisma.sql`p.parts_brand_id IN (${Prisma.join(request.partsBrandIds)})`,
            );
          }
          if (request.carModelIds.length > 0) {
            rawFilters.push(Prisma.sql`
              EXISTS (
                SELECT 1
                FROM product_compatibilities pc
                WHERE pc.product_id = p.id
                  AND pc.car_model_id IN (${Prisma.join(request.carModelIds)})
              )
            `);
          }

          const matches = await prisma.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(
              `SET LOCAL pg_trgm.word_similarity_threshold = ${WORD_SIMILARITY_THRESHOLD}`,
            );
            return tx.$queryRaw<{ id: string }[]>(Prisma.sql`
              SELECT p.id
              FROM products p
              WHERE ${Prisma.join(rawFilters, ' AND ')}
              ORDER BY p.name ASC
              LIMIT ${MAX_ITEMS}
            `);
          });
          where.id = { in: matches.map((match) => match.id) };
        }
      }

      const products = await prisma.product.findMany({
        where,
        select: itemSelect,
        orderBy: { name: 'asc' },
        take: MAX_ITEMS,
      });

      const pricingRole = pricingRoleFromUser(user.role);
      const items: PriceListItemVM[] = products.map((p) => {
        const resolved = resolveProductPrice(pricingFieldsFromProduct(p), pricingRole);
        return {
          sku: p.sku,
          name: p.name,
          brand: p.partsBrand.name,
          carType: p.compatibilities[0]?.carModel.name ?? '',
          priceToman: resolved.finalPrice,
        };
      });

      return {
        id: request.id,
        titles: request.titles,
        partsBrandIds: request.partsBrandIds,
        carModelIds: request.carModelIds,
        createdAt: formatJalaliDateTime(request.createdAt),
        expiresAt: formatJalaliDateTime(request.expiresAt),
        isExpired: request.expiresAt.getTime() < Date.now(),
        items,
      } satisfies PriceListRequestVM;
    },
    null,
  );
}
