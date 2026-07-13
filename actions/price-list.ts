'use server';

/**
 * Price-list Server Actions («دریافت لیست قیمت»).
 * ────────────────────────────────────────────────
 * The partner picks optional product-name titles, parts-brand and car-model
 * filters; we snapshot the filter as a `PriceListRequest` valid for ~24h and
 * resolve it to a concrete, printable list of parts + prices (downloaded as PDF
 * via the browser's print dialog on the request page).
 *
 * The title filter is a plain catalogue substring filter (it must return *every*
 * matching part for a complete list), distinct from the storefront's ranked
 * typo-tolerant search box — so it intentionally does not call `searchProducts`.
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
import type { Prisma } from '@/generated/prisma_client';
import type { PriceListRequestVM, PriceListItemVM } from '@/src/lib/dashboard-types';

/** Hours a generated price list stays valid before it must be regenerated. */
const VALID_HOURS = 24;
/** Cap on rows in one list — keeps the printable file small, as the UI notes. */
const MAX_ITEMS = 1000;

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
        where.OR = request.titles.map((t) => ({
          name: { contains: t, mode: 'insensitive' as const },
        }));
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
