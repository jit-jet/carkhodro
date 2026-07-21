/**
 * Product Server Actions — reads only.
 *
 * Reads use the `use cache` directive (Cache Components) with a `hours` profile
 * — product/price/stock data refreshes a few times a day but is otherwise served
 * from the prerendered shell. Each read is tagged so mutations can invalidate
 * precisely.
 *
 * Mutations live in `actions/admin-products.ts` instead: a file mixing
 * `use cache` reads with `use server` writes cannot be imported from a Client
 * Component (Next bundles the whole module, including the cache/`pg` machinery,
 * for the browser). Admin Client Components import mutations from there; this
 * file stays Server-Component-only, as it always was for the storefront.
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import {
  productInclude,
  toProductVM,
  toPDPProductVM,
  applyRoleToProduct,
  applyRoleToProducts,
  type ProductVM,
  type PDPProductVM,
} from '@/src/lib/serializers';
import { pricingRoleFromUser } from '@/src/lib/user-role';
import { getCurrentUser } from '@/src/lib/session';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';
import {
  computeRetailPrice,
  computeRetailFinal,
  computeWholesaleFinal,
} from '@/src/lib/pricing';
import { buildAdminProductWhere } from '@/src/lib/admin-product-where';

/** Re-resolve cached product VMs for the current viewer's role. */
export async function withViewerPricing(products: ProductVM[]): Promise<ProductVM[]> {
  const user = await getCurrentUser();
  return applyRoleToProducts(products, pricingRoleFromUser(user?.role));
}

export async function withViewerProduct(
  product: PDPProductVM | null,
): Promise<PDPProductVM | null> {
  if (!product) return null;
  const user = await getCurrentUser();
  return applyRoleToProduct(product, pricingRoleFromUser(user?.role)) as PDPProductVM;
}

/** All active products — consumed by the PLP, which filters/sorts client-side. */
export async function getProducts(): Promise<ProductVM[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.products);

  return safeQuery('getProducts', async () => {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((p) => toProductVM(p));
  }, []);
}

/** Newest active products for the "جدیدترین محصولات" home slider. */
export async function getNewArrivals(limit = 10): Promise<ProductVM[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.products);

  return safeQuery('getNewArrivals', async () => {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((p) => toProductVM(p));
  }, []);
}

/** Active products currently on offer — "پیشنهادات شگفت‌انگیز" home slider. */
export async function getSpecialOffers(limit = 12): Promise<ProductVM[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.products);

  return safeQuery('getSpecialOffers', async () => {
    const rows = await prisma.product.findMany({
      where: { isActive: true, isOffer: true },
      include: productInclude,
      orderBy: { saleCount: 'desc' },
      take: limit,
    });
    return rows.map((p) => toProductVM(p));
  }, []);
}

/** Full PDP view-model (description, pack/carton, etc.) or null if not found. */
export async function getProductById(id: string): Promise<PDPProductVM | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.product(id));

  return safeQuery(`getProductById:${id}`, async () => {
    const row = await prisma.product.findFirst({
      where: { id, isActive: true },
      include: productInclude,
    });
    return row ? toPDPProductVM(row) : null;
  }, null);
}

/**
 * Related products: same category, excluding the product itself, then topped
 * up with best-sellers if the category is thin. Ordered by sales.
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: number,
  limit = 4,
): Promise<ProductVM[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.products);

  return safeQuery(`getRelatedProducts:${productId}`, async () => {
    const rows = await prisma.product.findMany({
      where: { isActive: true, categoryId, id: { not: productId } },
      include: productInclude,
      orderBy: { saleCount: 'desc' },
      take: limit,
    });
    return rows.map((p) => toProductVM(p));
  }, []);
}

/** All active product ids — used by `generateStaticParams` to prerender PDPs. */
export async function getAllProductIds(): Promise<string[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.products);

  return safeQuery('getAllProductIds', async () => {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }, []);
}

/** Distinct filter option lists for the PLP sidebar. */
export async function getProductFilters(): Promise<{
  brands: { slug: string; name: string }[];
  carTypes: string[];
  categories: { key: string; label: string }[];
}> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.products, tags.categories, tags.partsBrands, tags.carModels);

  return safeQuery(
    'getProductFilters',
    async () => {
      const [partsBrands, categories, models] = await Promise.all([
        prisma.partsBrand.findMany({
          where: { products: { some: { isActive: true } } },
          orderBy: { name: 'asc' },
        }),
        prisma.category.findMany({
          where: { products: { some: { isActive: true } } },
          orderBy: { sortOrder: 'asc' },
        }),
        prisma.carModel.findMany({
          where: { compatibilities: { some: { product: { isActive: true } } } },
          orderBy: { name: 'asc' },
        }),
      ]);
      return {
        brands: partsBrands.map((b) => ({ slug: b.slug, name: b.name })),
        carTypes: [...new Set(models.map((m) => m.name))],
        categories: categories.map((c) => ({ key: c.key, label: c.name })),
      };
    },
    { brands: [], carTypes: [], categories: [] },
  );
}

// ── Admin panel: listing ─────────────────────────────────────────────────────
// Deliberately uncached (no `use cache`) — the admin table must always show
// fresh data (including inactive products) right after a mutation. Reads only —
// mutations (create/update/delete/bulk assign/upload) live in
// `actions/admin-products.ts` so this file stays safe to import from Server
// Components without dragging Prisma/`pg` into any client bundle.

export type AdminProductSortBy =
  | 'name'
  | 'category'
  | 'partsBrand'
  | 'wholesalePrice'
  | 'retailPrice'
  | 'stock'
  | 'isActive'
  | 'isOffer'
  | 'createdAt';

export type AdminProductSortDir = 'asc' | 'desc';

export interface AdminProductListItemVM {
  id: string;
  sku: string;
  name: string;
  categoryId: number;
  categoryName: string;
  partsBrandId: number;
  /** Parts brand name — shown as “نوع برند”. */
  partsBrandName: string;
  /** First compatible car model id — used as “مدل خودرو”. */
  carModelId: number | null;
  /** First compatible car model name — “مدل خودرو”. */
  carType: string;
  wholesalePrice: number;
  wholesaleDiscountPct: number;
  retailPriceDiffPct: number;
  retailDiscountPct: number;
  retailPrice: number; // computed list price
  retailFinal: number; // computed after retail discount
  wholesaleFinal: number; // computed after wholesale discount
  stock: number;
  isActive: boolean;
  isOffer: boolean;
  mainImage: string | null;
}

export interface AdminProductFilters {
  search?: string;
  categoryId?: number;
  partsBrandId?: number;
  carModelId?: number;
  isActive?: boolean;
  isOffer?: boolean;
  sortBy?: AdminProductSortBy;
  sortDir?: AdminProductSortDir;
  page?: number;
  perPage?: number;
}

export interface AdminProductPage {
  items: AdminProductListItemVM[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

function toAdminProductListItem(p: {
  id: string;
  sku: string;
  name: string;
  categoryId: number;
  category: { name: string };
  partsBrandId: number;
  partsBrand: { name: string };
  compatibilities: { carModelId: number; carModel: { name: string } }[];
  wholesalePrice: bigint;
  wholesaleDiscountPct: unknown;
  retailPriceDiffPct: unknown;
  retailDiscountPct: unknown;
  stock: number;
  isActive: boolean;
  isOffer: boolean;
  mainImage: string | null;
}): AdminProductListItemVM {
  const fields = {
    wholesalePrice: p.wholesalePrice,
    wholesaleDiscountPct: Number(p.wholesaleDiscountPct),
    retailPriceDiffPct: Number(p.retailPriceDiffPct),
    retailDiscountPct: Number(p.retailDiscountPct),
  };
  const firstCompat = p.compatibilities[0];
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    partsBrandId: p.partsBrandId,
    partsBrandName: p.partsBrand.name,
    carModelId: firstCompat?.carModelId ?? null,
    carType: firstCompat?.carModel.name ?? '',
    wholesalePrice: Number(p.wholesalePrice),
    wholesaleDiscountPct: fields.wholesaleDiscountPct,
    retailPriceDiffPct: fields.retailPriceDiffPct,
    retailDiscountPct: fields.retailDiscountPct,
    retailPrice: computeRetailPrice(fields),
    retailFinal: computeRetailFinal(fields),
    wholesaleFinal: computeWholesaleFinal(fields),
    stock: p.stock,
    isActive: p.isActive,
    isOffer: p.isOffer,
    mainImage: p.mainImage,
  };
}

function adminProductOrderBy(
  sortBy: AdminProductSortBy | undefined,
  sortDir: AdminProductSortDir | undefined,
) {
  const dir = sortDir === 'asc' ? ('asc' as const) : ('desc' as const);
  switch (sortBy) {
    case 'name':
      return { name: dir };
    case 'category':
      return { category: { name: dir } };
    case 'partsBrand':
      return { partsBrand: { name: dir } };
    case 'wholesalePrice':
      return { wholesalePrice: dir };
    case 'retailPrice':
      // Retail is derived from wholesale + diff%; sort by those inputs.
      return [{ retailPriceDiffPct: dir }, { wholesalePrice: dir }];
    case 'stock':
      return { stock: dir };
    case 'isActive':
      return { isActive: dir };
    case 'isOffer':
      return { isOffer: dir };
    case 'createdAt':
      return { createdAt: dir };
    default:
      return { createdAt: 'desc' as const };
  }
}

export async function getProductsAdmin(
  filters: AdminProductFilters = {},
): Promise<AdminProductPage> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 20));

  return safeQuery(
    'getProductsAdmin',
    async () => {
      const where = {
        ...(filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: 'insensitive' as const } },
                { sku: { contains: filters.search, mode: 'insensitive' as const } },
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

      const orderBy = adminProductOrderBy(filters.sortBy, filters.sortDir);

      const [rows, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            partsBrand: true,
            compatibilities: {
              include: { carModel: true },
              orderBy: { id: 'asc' },
              take: 1,
            },
          },
          orderBy,
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        items: rows.map(toAdminProductListItem),
        total,
        page,
        perPage,
        pageCount: Math.max(1, Math.ceil(total / perPage)),
      };
    },
    { items: [], total: 0, page, perPage, pageCount: 1 },
  );
}

export async function getProductAdminById(id: string) {
  return safeQuery(
    `getProductAdminById:${id}`,
    async () => {
      const row = await prisma.product.findUnique({
        where: { id },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          compatibilities: {
            include: { carModel: true },
            orderBy: { id: 'asc' },
            take: 1,
          },
        },
      });
      if (!row) return null;
      const galleryUrls = row.images.map((img) => img.url);
      // Ensure main image is present in the gallery list for the editor.
      const images =
        row.mainImage && !galleryUrls.includes(row.mainImage)
          ? [row.mainImage, ...galleryUrls]
          : galleryUrls.length > 0
            ? galleryUrls
            : row.mainImage
              ? [row.mainImage]
              : [];
      return {
        id: row.id,
        sku: row.sku,
        name: row.name,
        partsBrandId: row.partsBrandId,
        categoryId: row.categoryId,
        carModelId: row.compatibilities[0]?.carModelId ?? null,
        wholesalePrice: Number(row.wholesalePrice),
        wholesaleDiscountPct: Number(row.wholesaleDiscountPct),
        retailPriceDiffPct: Number(row.retailPriceDiffPct),
        retailDiscountPct: Number(row.retailDiscountPct),
        isOffer: row.isOffer,
        isActive: row.isActive,
        stock: row.stock,
        origin: row.origin,
        mainImage: row.mainImage,
        images,
        description: row.description,
      };
    },
    null,
  );
}
