'use server';

/**
 * Admin reporting reads — monthly sales, inventory, and most-viewed products.
 * Pure `use server` so Client Components can import filter helpers' sibling
 * mutations later if needed; today this module is read-only.
 */

import { prisma } from '@/src/lib/prisma';
import { safeQuery } from '@/src/lib/result';
import {
  clampPage,
  pageCountOf,
  type AdminPerPage,
  ADMIN_DEFAULT_PER_PAGE,
} from '@/src/lib/admin-pagination';
import {
  jalaliMonthLabel,
  jalaliMonthRange,
} from '@/src/lib/admin-reports-query';
import type {
  InventorySortBy,
  InventoryStockFilter,
  ReportSortDir,
  ViewsSortBy,
} from '@/src/lib/admin-reports-query';
import type { Prisma, UserRole } from '@/generated/prisma_client';

/** Cancelled / archived orders are excluded from sales totals. */
const EXCLUDED_ORDER_STATUSES = [
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_MANAGER',
  'ARCHIVED',
] as const;

const LOW_STOCK_THRESHOLD = 5;

// ── Shared helpers ────────────────────────────────────────────────────────────

function bigintToNumber(value: bigint | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

// ── Monthly sales ─────────────────────────────────────────────────────────────

export interface ChannelSalesStatsVM {
  orderCount: number;
  /** Sum of `Order.totalAmount` (payable including shipping − coupons). */
  totalOrderAmount: number;
  /** Sum of `Order.subtotal` (merchandise after line discounts). */
  totalSalesAmount: number;
}

export interface MonthlySalesReportVM {
  year: number;
  month: number;
  monthLabel: string;
  retail: ChannelSalesStatsVM;
  wholesale: ChannelSalesStatsVM;
  total: ChannelSalesStatsVM;
}

const EMPTY_CHANNEL: ChannelSalesStatsVM = {
  orderCount: 0,
  totalOrderAmount: 0,
  totalSalesAmount: 0,
};

async function aggregateSalesForRole(
  start: Date,
  end: Date,
  role: UserRole,
): Promise<ChannelSalesStatsVM> {
  const result = await prisma.order.aggregate({
    where: {
      createdAt: { gte: start, lt: end },
      status: { notIn: [...EXCLUDED_ORDER_STATUSES] },
      user: { role },
    },
    _count: { _all: true },
    _sum: { totalAmount: true, subtotal: true },
  });
  return {
    orderCount: result._count._all,
    totalOrderAmount: bigintToNumber(result._sum.totalAmount),
    totalSalesAmount: bigintToNumber(result._sum.subtotal),
  };
}

function sumChannels(
  a: ChannelSalesStatsVM,
  b: ChannelSalesStatsVM,
): ChannelSalesStatsVM {
  return {
    orderCount: a.orderCount + b.orderCount,
    totalOrderAmount: a.totalOrderAmount + b.totalOrderAmount,
    totalSalesAmount: a.totalSalesAmount + b.totalSalesAmount,
  };
}

export async function getMonthlySalesReport(
  year: number,
  month: number,
): Promise<MonthlySalesReportVM> {
  const fallback: MonthlySalesReportVM = {
    year,
    month,
    monthLabel: jalaliMonthLabel(year, month),
    retail: { ...EMPTY_CHANNEL },
    wholesale: { ...EMPTY_CHANNEL },
    total: { ...EMPTY_CHANNEL },
  };

  return safeQuery(
    'getMonthlySalesReport',
    async () => {
      const range = jalaliMonthRange(year, month);
      if (!range) return fallback;

      const [retail, wholesale] = await Promise.all([
        aggregateSalesForRole(range.start, range.end, 'RETAIL'),
        aggregateSalesForRole(range.start, range.end, 'WHOLESALE'),
      ]);

      return {
        year,
        month,
        monthLabel: jalaliMonthLabel(year, month),
        retail,
        wholesale,
        total: sumChannels(retail, wholesale),
      };
    },
    fallback,
  );
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export interface InventoryReportItemVM {
  id: string;
  sku: string;
  name: string;
  stock: number;
  isActive: boolean;
  categoryName: string;
  partsBrandName: string;
}

export interface InventoryReportPage {
  items: InventoryReportItemVM[];
  total: number;
  page: number;
  pageCount: number;
  perPage: number;
  summary: {
    totalProducts: number;
    inStockCount: number;
    outOfStockCount: number;
    lowStockCount: number;
    totalUnits: number;
  };
}

export interface InventoryReportFilters {
  q?: string;
  stock?: InventoryStockFilter;
  sortBy?: InventorySortBy;
  sortDir?: ReportSortDir;
  page?: number;
  perPage?: AdminPerPage;
}

function inventoryWhere(
  filters: InventoryReportFilters,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
    ];
  }
  switch (filters.stock) {
    case 'in_stock':
      where.stock = { gt: 0 };
      break;
    case 'out_of_stock':
      where.stock = { lte: 0 };
      break;
    case 'low':
      where.stock = { gt: 0, lte: LOW_STOCK_THRESHOLD };
      break;
    default:
      break;
  }
  return where;
}

function inventoryOrderBy(
  sortBy: InventorySortBy = 'stock',
  sortDir: ReportSortDir = 'asc',
): Prisma.ProductOrderByWithRelationInput[] {
  const dir = sortDir === 'desc' ? 'desc' : 'asc';
  if (sortBy === 'name') return [{ name: dir }, { sku: 'asc' }];
  if (sortBy === 'sku') return [{ sku: dir }];
  return [{ stock: dir }, { name: 'asc' }];
}

export async function getInventoryReport(
  filters: InventoryReportFilters = {},
): Promise<InventoryReportPage> {
  const perPage = filters.perPage ?? ADMIN_DEFAULT_PER_PAGE;
  const empty: InventoryReportPage = {
    items: [],
    total: 0,
    page: 1,
    pageCount: 1,
    perPage,
    summary: {
      totalProducts: 0,
      inStockCount: 0,
      outOfStockCount: 0,
      lowStockCount: 0,
      totalUnits: 0,
    },
  };

  return safeQuery(
    'getInventoryReport',
    async () => {
      const where = inventoryWhere(filters);

      const [total, summaryAgg, inStockCount, outOfStockCount, lowStockCount] =
        await Promise.all([
          prisma.product.count({ where }),
          prisma.product.aggregate({
            _count: { _all: true },
            _sum: { stock: true },
          }),
          prisma.product.count({ where: { stock: { gt: 0 } } }),
          prisma.product.count({ where: { stock: { lte: 0 } } }),
          prisma.product.count({
            where: { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
          }),
        ]);

      const pageCount = pageCountOf(total, perPage);
      const page = clampPage(filters.page ?? 1, pageCount);

      const items = await prisma.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          name: true,
          stock: true,
          isActive: true,
          category: { select: { name: true } },
          partsBrand: { select: { name: true } },
        },
        orderBy: inventoryOrderBy(filters.sortBy, filters.sortDir),
        skip: (page - 1) * perPage,
        take: perPage,
      });

      return {
        items: items.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          stock: p.stock,
          isActive: p.isActive,
          categoryName: p.category.name,
          partsBrandName: p.partsBrand.name,
        })),
        total,
        page,
        pageCount,
        perPage,
        summary: {
          totalProducts: summaryAgg._count._all,
          inStockCount,
          outOfStockCount,
          lowStockCount,
          totalUnits: summaryAgg._sum.stock ?? 0,
        },
      };
    },
    empty,
  );
}

// ── Most viewed ───────────────────────────────────────────────────────────────

export interface MostViewedProductVM {
  id: string;
  sku: string;
  name: string;
  viewCount: number;
  saleCount: number;
  stock: number;
  isActive: boolean;
  categoryName: string;
}

export interface MostViewedReportPage {
  items: MostViewedProductVM[];
  total: number;
  page: number;
  pageCount: number;
  perPage: number;
}

export interface MostViewedReportFilters {
  q?: string;
  sortBy?: ViewsSortBy;
  sortDir?: ReportSortDir;
  page?: number;
  perPage?: AdminPerPage;
}

function viewsWhere(filters: MostViewedReportFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
    ];
  }
  return where;
}

function viewsOrderBy(
  sortBy: ViewsSortBy = 'viewCount',
  sortDir: ReportSortDir = 'desc',
): Prisma.ProductOrderByWithRelationInput[] {
  const dir = sortDir === 'asc' ? 'asc' : 'desc';
  if (sortBy === 'saleCount') return [{ saleCount: dir }, { name: 'asc' }];
  if (sortBy === 'name') return [{ name: dir }];
  return [{ viewCount: dir }, { name: 'asc' }];
}

export async function getMostViewedProductsReport(
  filters: MostViewedReportFilters = {},
): Promise<MostViewedReportPage> {
  const perPage = filters.perPage ?? ADMIN_DEFAULT_PER_PAGE;
  const empty: MostViewedReportPage = {
    items: [],
    total: 0,
    page: 1,
    pageCount: 1,
    perPage,
  };

  return safeQuery(
    'getMostViewedProductsReport',
    async () => {
      const where = viewsWhere(filters);
      const total = await prisma.product.count({ where });
      const pageCount = pageCountOf(total, perPage);
      const page = clampPage(filters.page ?? 1, pageCount);

      const items = await prisma.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          name: true,
          viewCount: true,
          saleCount: true,
          stock: true,
          isActive: true,
          category: { select: { name: true } },
        },
        orderBy: viewsOrderBy(filters.sortBy, filters.sortDir),
        skip: (page - 1) * perPage,
        take: perPage,
      });

      return {
        items: items.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          viewCount: p.viewCount,
          saleCount: p.saleCount,
          stock: p.stock,
          isActive: p.isActive,
          categoryName: p.category.name,
        })),
        total,
        page,
        pageCount,
        perPage,
      };
    },
    empty,
  );
}
