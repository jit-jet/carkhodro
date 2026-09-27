'use server';

import type { Prisma } from '@/generated/prisma_client';
import { prisma } from '@/src/lib/prisma';
import {
  applyRoleToProducts,
  productInclude,
  toProductVM,
  type ProductVM,
  type ProductWithRelations,
} from '@/src/lib/serializers';
import { getCurrentUser } from '@/src/lib/session';
import { pricingRoleFromUser } from '@/src/lib/user-role';
import { getDefaultImageUrl } from '@/src/lib/default-image';
import { safeQuery } from '@/src/lib/result';
import { searchProductBrowsePage } from '@/actions/search';
import {
  PRODUCT_PAGE_SIZE,
  resolveProductBrowseSort,
  type ProductBrowseInput,
  type ProductBrowsePage,
  type ProductBrowseSort,
} from '@/src/lib/product-browse';

const EMPTY_PAGE: ProductBrowsePage = {
  items: [],
  total: 0,
  nextPage: 2,
  hasMore: false,
};

function cleanValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 50);
}

function normalizeInput(input: ProductBrowseInput): ProductBrowseInput {
  const query = typeof input.query === 'string' ? input.query.trim().slice(0, 200) : '';
  return {
    page: Math.max(1, Math.min(10_000, Math.trunc(input.page) || 1)),
    query,
    brands: cleanValues(Array.isArray(input.brands) ? input.brands : []),
    carBrands: cleanValues(Array.isArray(input.carBrands) ? input.carBrands : []),
    carTypes: cleanValues(Array.isArray(input.carTypes) ? input.carTypes : []),
    categories: cleanValues(Array.isArray(input.categories) ? input.categories : []),
    offerOnly: input.offerOnly === true,
    sort: resolveProductBrowseSort(
      typeof input.sort === 'string' ? input.sort : null,
      query.length > 0,
    ),
  };
}

function productWhere(input: ProductBrowseInput): Prisma.ProductWhereInput {
  const compatibilityFilters: Prisma.ProductWhereInput[] = [];
  if (input.carBrands.length) {
    compatibilityFilters.push({
      compatibilities: {
        some: { carModel: { carBrand: { slug: { in: input.carBrands } } } },
      },
    });
  }
  if (input.carTypes.length) {
    compatibilityFilters.push({
      compatibilities: { some: { carModel: { name: { in: input.carTypes } } } },
    });
  }

  return {
    isActive: true,
    ...(input.brands.length
      ? { partsBrand: { slug: { in: input.brands } } }
      : {}),
    ...(compatibilityFilters.length ? { AND: compatibilityFilters } : {}),
    ...(input.categories.length ? { category: { key: { in: input.categories } } } : {}),
    ...(input.offerOnly ? { isOffer: true } : {}),
  };
}

function productOrderBy(sort: ProductBrowseSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'oldest':
      return [{ createdAt: 'asc' }, { id: 'asc' }];
    case 'best_selling':
      return [{ saleCount: 'desc' }, { id: 'asc' }];
    case 'most_viewed':
      return [{ viewCount: 'desc' }, { id: 'asc' }];
    case 'alpha_asc':
      return [{ name: 'asc' }, { id: 'asc' }];
    case 'alpha_desc':
      return [{ name: 'desc' }, { id: 'asc' }];
    case 'relevance':
    case 'newest':
      return [{ createdAt: 'desc' }, { id: 'asc' }];
  }
}

async function queryNonSearchProducts(
  input: ProductBrowseInput,
  take: number,
): Promise<{ rows: ProductWithRelations[]; total: number }> {
  const where = productWhere(input);
  const inStockWhere: Prisma.ProductWhereInput = { ...where, stock: { gt: 0 } };
  const outOfStockWhere: Prisma.ProductWhereInput = { ...where, stock: { lte: 0 } };
  const offset = (input.page - 1) * take;
  const orderBy = productOrderBy(input.sort);

  const [total, inStockTotal] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count({ where: inStockWhere }),
  ]);

  const rows: ProductWithRelations[] = [];
  if (offset < inStockTotal) {
    rows.push(
      ...(await prisma.product.findMany({
        where: inStockWhere,
        include: productInclude,
        orderBy,
        skip: offset,
        take,
      })),
    );
  }

  const remaining = take - rows.length;
  if (remaining > 0) {
    rows.push(
      ...(await prisma.product.findMany({
        where: outOfStockWhere,
        include: productInclude,
        orderBy,
        skip: Math.max(0, offset - inStockTotal),
        take: remaining,
      })),
    );
  }

  return { rows, total };
}

async function browsePage(input: ProductBrowseInput): Promise<ProductBrowsePage> {
  const normalized = normalizeInput(input);
  const offset = (normalized.page - 1) * PRODUCT_PAGE_SIZE;

  if (normalized.query) {
    const result = await searchProductBrowsePage(
      normalized,
      offset,
      PRODUCT_PAGE_SIZE,
    );
    return {
      items: result.items,
      total: result.total,
      nextPage: normalized.page + 1,
      hasMore: offset + result.items.length < result.total,
    };
  }

  const [{ rows, total }, user, fallbackImage] = await Promise.all([
    queryNonSearchProducts(normalized, PRODUCT_PAGE_SIZE),
    getCurrentUser(),
    getDefaultImageUrl(),
  ]);
  const role = pricingRoleFromUser(user?.role);
  const items = rows.map((row) => toProductVM(row, role, fallbackImage));
  return {
    items,
    total,
    nextPage: normalized.page + 1,
    hasMore: offset + items.length < total,
  };
}

export async function getProductBrowsePage(
  input: ProductBrowseInput,
): Promise<ProductBrowsePage> {
  return safeQuery(`getProductBrowsePage:${input.page}`, () => browsePage(input), {
    ...EMPTY_PAGE,
    nextPage: Math.max(2, input.page + 1),
    failed: true,
  });
}

export async function getProductsForExport(input: ProductBrowseInput): Promise<ProductVM[]> {
  const normalized = normalizeInput({ ...input, page: 1 });
  if (normalized.query) {
    const result = await searchProductBrowsePage(normalized, 0, null);
    return result.items.filter((product) => product.stock > 0);
  }

  return safeQuery('getProductsForExport', async () => {
    const where: Prisma.ProductWhereInput = { ...productWhere(normalized), stock: { gt: 0 } };
    const [rows, user, fallbackImage] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: productOrderBy(normalized.sort),
      }),
      getCurrentUser(),
      getDefaultImageUrl(),
    ]);
    return applyRoleToProducts(
      rows.map((row) => toProductVM(row, null, fallbackImage)),
      pricingRoleFromUser(user?.role),
    );
  }, []);
}
