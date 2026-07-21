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
};

export function buildAdminProductWhere(
  filters: AdminProductWhereFilters,
): Prisma.ProductWhereInput {
  return {
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { sku: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.partsBrandId ? { partsBrandId: filters.partsBrandId } : {}),
    ...(filters.carModelId
      ? { compatibilities: { some: { carModelId: filters.carModelId } } }
      : {}),
    ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    ...(filters.isOffer !== undefined ? { isOffer: filters.isOffer } : {}),
  };
}
