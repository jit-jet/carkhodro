/**
 * Product Server Actions.
 *
 * Reads use the `use cache` directive (Cache Components) with a `hours` profile
 * — product/price/stock data refreshes a few times a day but is otherwise served
 * from the prerendered shell. Each read is tagged so mutations can invalidate
 * precisely. Mutations use `use server` and call `updateTag` so an admin sees
 * their own write immediately.
 */

import { cacheLife, cacheTag, updateTag } from 'next/cache';
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
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

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
  brands: string[];
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
        brands: partsBrands.map((b) => b.name),
        carTypes: [...new Set(models.map((m) => m.name))],
        categories: categories.map((c) => ({ key: c.key, label: c.name })),
      };
    },
    { brands: [], carTypes: [], categories: [] },
  );
}

// ── Mutations (baseline CRUD) ────────────────────────────────────────────────

export interface ProductInput {
  sku: string;
  name: string;
  partsBrandId: number;
  categoryId: number;
  wholesalePrice: number;
  wholesaleDiscountPct?: number;
  retailPriceDiffPct?: number;
  retailDiscountPct?: number;
  isOffer?: boolean;
  stock?: number;
  warranty?: string | null;
  origin?: string | null;
  mainImage?: string | null;
  description?: string | null;
}

export async function createProduct(
  input: ProductInput,
): Promise<ActionResult<{ id: string }>> {
  'use server';
  return runMutation('createProduct', async () => {
    if (!input.sku?.trim() || !input.name?.trim()) {
      return fail('کد کالا و نام محصول الزامی است.');
    }
    const created = await prisma.product.create({
      data: {
        sku: input.sku.trim(),
        name: input.name.trim(),
        partsBrandId: input.partsBrandId,
        categoryId: input.categoryId,
        wholesalePrice: BigInt(Math.round(input.wholesalePrice)),
        wholesaleDiscountPct: input.wholesaleDiscountPct ?? 0,
        retailPriceDiffPct: input.retailPriceDiffPct ?? 25,
        retailDiscountPct: input.retailDiscountPct ?? 0,
        isOffer: input.isOffer ?? false,
        stock: input.stock ?? 0,
        warranty: input.warranty ?? null,
        origin: input.origin ?? null,
        mainImage: input.mainImage ?? null,
        description: input.description ?? null,
      },
      select: { id: true },
    });
    updateTag(tags.products);
    return ok(created);
  });
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<ActionResult<{ id: string }>> {
  'use server';
  return runMutation('updateProduct', async () => {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(input.sku !== undefined ? { sku: input.sku.trim() } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.partsBrandId !== undefined ? { partsBrandId: input.partsBrandId } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.wholesalePrice !== undefined
          ? { wholesalePrice: BigInt(Math.round(input.wholesalePrice)) }
          : {}),
        ...(input.wholesaleDiscountPct !== undefined
          ? { wholesaleDiscountPct: input.wholesaleDiscountPct }
          : {}),
        ...(input.retailPriceDiffPct !== undefined
          ? { retailPriceDiffPct: input.retailPriceDiffPct }
          : {}),
        ...(input.retailDiscountPct !== undefined
          ? { retailDiscountPct: input.retailDiscountPct }
          : {}),
        ...(input.isOffer !== undefined ? { isOffer: input.isOffer } : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.warranty !== undefined ? { warranty: input.warranty } : {}),
        ...(input.origin !== undefined ? { origin: input.origin } : {}),
        ...(input.mainImage !== undefined ? { mainImage: input.mainImage } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
      select: { id: true },
    });
    updateTag(tags.products);
    updateTag(tags.product(id));
    return ok(updated);
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  'use server';
  return runMutation('deleteProduct', async () => {
    // Soft delete — keep order history intact, just drop it from the catalogue.
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    updateTag(tags.products);
    updateTag(tags.product(id));
    return ok(undefined);
  });
}

/** Fire-and-forget view counter. Uses stale-while-revalidate to avoid thrash. */
export async function incrementProductView(id: string): Promise<ActionResult> {
  'use server';
  return runMutation('incrementProductView', async () => {
    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return ok(undefined);
  });
}
