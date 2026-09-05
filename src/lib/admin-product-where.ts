/**
 * Shared Prisma `where` builder for admin product list filters.
 * Used by the list query and by filter-scoped bulk updates so both stay in sync.
 */

import type { Prisma } from "@/generated/prisma_client";

export type AdminProductWhereFilters = {
  search?: string;
  categoryId?: number;
  partsBrandId?: number;
  carModelId?: number;
  isActive?: boolean;
  isOffer?: boolean;
  /** in_stock | out_of_stock */
  stock?: "in_stock" | "out_of_stock";
  /** retail | wholesale | none | any */
  callForPrice?: "retail" | "wholesale" | "none" | "any";
};

export function buildAdminProductWhere(
  filters: AdminProductWhereFilters,
): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.search) {
    and.push({
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  if (filters.callForPrice === "retail") {
    and.push({ callForPriceRetail: true });
  } else if (filters.callForPrice === "wholesale") {
    and.push({ callForPriceWholesale: true });
  } else if (filters.callForPrice === "none") {
    and.push({ callForPriceRetail: false, callForPriceWholesale: false });
  } else if (filters.callForPrice === "any") {
    and.push({
      OR: [{ callForPriceRetail: true }, { callForPriceWholesale: true }],
    });
  }

  if (filters.stock === "in_stock") {
    and.push({ stock: { gt: 0 } });
  } else if (filters.stock === "out_of_stock") {
    and.push({ stock: { lte: 0 } });
  }

  return {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.partsBrandId ? { partsBrandId: filters.partsBrandId } : {}),
    ...(filters.carModelId
      ? { compatibilities: { some: { carModelId: filters.carModelId } } }
      : {}),
    ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    ...(filters.isOffer !== undefined ? { isOffer: filters.isOffer } : {}),
    ...(and.length > 0 ? { AND: and } : {}),
  };
}
