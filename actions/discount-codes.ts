/**
 * Discount-code Server Actions — reads only (admin list / edit pages).
 * Mutations live in `actions/admin-discount-codes.ts` so Client Components can
 * import writes without pulling any future `use cache` reads into the bundle.
 */

import { prisma } from '@/src/lib/prisma';
import { safeQuery } from '@/src/lib/result';
import type { DiscountScopeType, DiscountType } from '@/generated/prisma_client';

export interface AdminDiscountCodeListItemVM {
  id: string;
  code: string;
  type: DiscountType;
  value: number | null;
  startsAt: string;
  endsAt: string | null;
  scopeType: DiscountScopeType;
  scopeCount: number;
  usedCount: number;
  totalUsageLimit: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminDiscountCodeDetailVM {
  id: string;
  code: string;
  type: DiscountType;
  value: number | null;
  startsAt: string;
  endsAt: string | null;
  scopeType: DiscountScopeType;
  scopeIds: string[];
  /** Resolved labels for selected scope targets (for edit form chips). */
  scopeLabels: { id: string; label: string }[];
  perCustomerLimit: number | null;
  totalUsageLimit: number | null;
  usedCount: number;
  minCartAmount: number | null;
  maxDiscountAmount: number | null;
  firstOrderOnly: boolean;
  minPreviousOrders: number | null;
  isActive: boolean;
}

export interface AdminDiscountCodeFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  type?: DiscountType | 'all';
  page?: number;
  perPage?: number;
}

export interface AdminDiscountCodePage {
  items: AdminDiscountCodeListItemVM[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

function toListItem(row: {
  id: string;
  code: string;
  type: DiscountType;
  value: unknown;
  startsAt: Date;
  endsAt: Date | null;
  scopeType: DiscountScopeType;
  scopeIds: string[];
  usedCount: number;
  totalUsageLimit: number | null;
  isActive: boolean;
  createdAt: Date;
}): AdminDiscountCodeListItemVM {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value == null ? null : Number(row.value),
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    scopeType: row.scopeType,
    scopeCount: row.scopeIds.length,
    usedCount: row.usedCount,
    totalUsageLimit: row.totalUsageLimit,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getDiscountCodesAdmin(
  filters: AdminDiscountCodeFilters = {},
): Promise<AdminDiscountCodePage> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 20));
  const empty: AdminDiscountCodePage = { items: [], total: 0, page, perPage, pageCount: 0 };

  return safeQuery(
    'getDiscountCodesAdmin',
    async () => {
      const where = {
        ...(filters.search
          ? { code: { contains: filters.search.trim().toUpperCase(), mode: 'insensitive' as const } }
          : {}),
        ...(filters.status === 'active'
          ? { isActive: true }
          : filters.status === 'inactive'
            ? { isActive: false }
            : {}),
        ...(filters.type && filters.type !== 'all' ? { type: filters.type } : {}),
      };

      const [rows, total] = await Promise.all([
        prisma.discountCode.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.discountCode.count({ where }),
      ]);

      return {
        items: rows.map(toListItem),
        total,
        page,
        perPage,
        pageCount: Math.max(1, Math.ceil(total / perPage)),
      };
    },
    empty,
  );
}

async function resolveScopeLabels(
  scopeType: DiscountScopeType,
  scopeIds: string[],
): Promise<{ id: string; label: string }[]> {
  if (scopeIds.length === 0) return [];

  if (scopeType === 'CATEGORY') {
    const ids = scopeIds.map(Number).filter((n) => Number.isFinite(n));
    const rows = await prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const map = new Map(rows.map((r) => [String(r.id), r.name]));
    return scopeIds.filter((id) => map.has(id)).map((id) => ({ id, label: map.get(id)! }));
  }

  if (scopeType === 'BRAND') {
    const ids = scopeIds.map(Number).filter((n) => Number.isFinite(n));
    const rows = await prisma.partsBrand.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const map = new Map(rows.map((r) => [String(r.id), r.name]));
    return scopeIds.filter((id) => map.has(id)).map((id) => ({ id, label: map.get(id)! }));
  }

  if (scopeType === 'CAR_BRAND') {
    const ids = scopeIds.map(Number).filter((n) => Number.isFinite(n));
    const rows = await prisma.carBrand.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const map = new Map(rows.map((r) => [String(r.id), r.name]));
    return scopeIds.filter((id) => map.has(id)).map((id) => ({ id, label: map.get(id)! }));
  }

  if (scopeType === 'CAR_MODEL') {
    const ids = scopeIds.map(Number).filter((n) => Number.isFinite(n));
    const rows = await prisma.carModel.findMany({
      where: { id: { in: ids } },
      include: { carBrand: { select: { name: true } } },
    });
    const map = new Map(
      rows.map((r) => [String(r.id), `${r.carBrand.name} — ${r.name}`]),
    );
    return scopeIds.filter((id) => map.has(id)).map((id) => ({ id, label: map.get(id)! }));
  }

  const rows = await prisma.product.findMany({
    where: { id: { in: scopeIds } },
    select: { id: true, name: true, sku: true },
  });
  const map = new Map(rows.map((r) => [r.id, `${r.name} (${r.sku})`]));
  return scopeIds.filter((id) => map.has(id)).map((id) => ({ id, label: map.get(id)! }));
}

export async function getDiscountCodeAdminById(
  id: string,
): Promise<AdminDiscountCodeDetailVM | null> {
  return safeQuery(
    `getDiscountCodeAdminById:${id}`,
    async () => {
      const row = await prisma.discountCode.findUnique({ where: { id } });
      if (!row) return null;
      const scopeLabels = await resolveScopeLabels(row.scopeType, row.scopeIds);
      return {
        id: row.id,
        code: row.code,
        type: row.type,
        value: row.value == null ? null : Number(row.value),
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt ? row.endsAt.toISOString() : null,
        scopeType: row.scopeType,
        scopeIds: row.scopeIds,
        scopeLabels,
        perCustomerLimit: row.perCustomerLimit,
        totalUsageLimit: row.totalUsageLimit,
        usedCount: row.usedCount,
        minCartAmount: row.minCartAmount == null ? null : Number(row.minCartAmount),
        maxDiscountAmount: row.maxDiscountAmount == null ? null : Number(row.maxDiscountAmount),
        firstOrderOnly: row.firstOrderOnly,
        minPreviousOrders: row.minPreviousOrders,
        isActive: row.isActive,
      };
    },
    null,
  );
}
