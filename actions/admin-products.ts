'use server';

/**
 * Product mutation Server Actions — admin panel.
 * ─────────────────────────────────────────────────
 * Split out of `actions/products.ts` (which mixes `use cache` reads with
 * plain reads) because a file imported by a Client Component must be either
 * entirely `use server` or entirely `use cache`/directive-free — these writes
 * are consumed directly by `ProductForm`/`ProductsTable` (Client Components),
 * so they need their own pure-`use server` module.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';
import { saveFile } from '@/src/lib/storage';
import {
  buildAdminProductWhere,
  type AdminProductWhereFilters,
} from '@/src/lib/admin-product-where';
import crypto from 'node:crypto';

export interface ProductInput {
  sku: string;
  name: string;
  partsBrandId: number;
  categoryId: number;
  /** Compatible car model (“نوع خودرو”). Null clears compatibility. */
  carModelId?: number | null;
  wholesalePrice: number;
  wholesaleDiscountPct?: number;
  retailPriceDiffPct?: number;
  retailDiscountPct?: number;
  isOffer?: boolean;
  isActive?: boolean;
  stock?: number;
  origin?: string | null;
  mainImage?: string | null;
  /** Gallery image URLs (including main). Order is preserved as sortOrder. */
  images?: string[];
  description?: string | null;
}

async function syncProductImages(productId: string, images: string[] | undefined) {
  if (images === undefined) return;
  const urls = [...new Set(images.map((u) => u.trim()).filter(Boolean))];
  await prisma.productImage.deleteMany({ where: { productId } });
  if (urls.length === 0) return;
  await prisma.productImage.createMany({
    data: urls.map((url, sortOrder) => ({ productId, url, sortOrder })),
  });
}

async function syncProductVehicleType(productId: string, carModelId: number | null | undefined) {
  if (carModelId === undefined) return;
  await prisma.productCompatibility.deleteMany({ where: { productId } });
  if (carModelId === null) return;
  const carModel = await prisma.carModel.findUnique({ where: { id: carModelId } });
  if (!carModel) return;
  await prisma.productCompatibility.create({
    data: { productId, carModelId },
  });
}

export async function createProduct(
  input: ProductInput,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('createProduct', async () => {
    if (!input.sku?.trim() || !input.name?.trim()) {
      return fail('کد کالا و نام محصول الزامی است.');
    }
    if (input.carModelId != null) {
      const carModel = await prisma.carModel.findUnique({ where: { id: input.carModelId } });
      if (!carModel) return fail('نوع خودرو انتخاب‌شده معتبر نیست.');
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
        origin: input.origin ?? null,
        mainImage: input.mainImage ?? null,
        description: input.description ?? null,
      },
      select: { id: true },
    });
    await syncProductImages(created.id, input.images);
    await syncProductVehicleType(created.id, input.carModelId ?? null);
    updateTag(tags.products);
    return ok(created);
  });
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('updateProduct', async () => {
    if (input.carModelId != null) {
      const carModel = await prisma.carModel.findUnique({ where: { id: input.carModelId } });
      if (!carModel) return fail('نوع خودرو انتخاب‌شده معتبر نیست.');
    }
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
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.origin !== undefined ? { origin: input.origin } : {}),
        ...(input.mainImage !== undefined ? { mainImage: input.mainImage } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
      select: { id: true },
    });
    await syncProductImages(id, input.images);
    await syncProductVehicleType(id, input.carModelId);
    updateTag(tags.products);
    updateTag(tags.product(id));
    return ok(updated);
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return runMutation('deleteProduct', async () => {
    // Soft delete — keep order history intact, just drop it from the catalogue.
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    updateTag(tags.products);
    updateTag(tags.product(id));
    return ok(undefined);
  });
}

/** Restore a soft-deleted (inactive) product. */
export async function reactivateProduct(id: string): Promise<ActionResult> {
  return runMutation('reactivateProduct', async () => {
    await prisma.product.update({ where: { id }, data: { isActive: true } });
    updateTag(tags.products);
    updateTag(tags.product(id));
    return ok(undefined);
  });
}

/** Fire-and-forget view counter. */
export async function incrementProductView(id: string): Promise<ActionResult> {
  return runMutation('incrementProductView', async () => {
    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return ok(undefined);
  });
}

/** Bulk-assign a category to a set of products in one call. */
export async function bulkAssignCategory(
  productIds: string[],
  categoryId: number,
): Promise<ActionResult<{ count: number }>> {
  return bulkUpdateProducts({ mode: 'ids', productIds }, { op: 'category', categoryId });
}

export type BulkProductOp =
  | { op: 'category'; categoryId: number }
  | { op: 'brand'; partsBrandId: number }
  | { op: 'vehicleType'; carModelId: number }
  | { op: 'wholesaleDiscount'; value: number }
  | { op: 'retailDiscount'; value: number }
  | { op: 'retailPriceDiff'; value: number }
  | { op: 'setActive'; isActive: boolean }
  | { op: 'setOffer'; isOffer: boolean };

/** Either explicit IDs, or every product matching the current list filters (all pages). */
export type BulkProductTarget =
  | { mode: 'ids'; productIds: string[] }
  | { mode: 'filters'; filters: AdminProductWhereFilters };

function clampPct(value: number, min: number, max: number): number | null {
  if (!Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return Math.round(value * 100) / 100;
}

function touchProductTags(productIds: string[] | 'all-matching') {
  updateTag(tags.products);
  if (productIds === 'all-matching') return;
  for (const id of productIds) updateTag(tags.product(id));
}

/** Apply one bulk operation to the selected products (by ID list or by list filters). */
export async function bulkUpdateProducts(
  target: BulkProductTarget,
  action: BulkProductOp,
): Promise<ActionResult<{ count: number }>> {
  return runMutation('bulkUpdateProducts', async () => {
    const where =
      target.mode === 'ids'
        ? { id: { in: [...new Set(target.productIds)] } }
        : buildAdminProductWhere(target.filters);

    if (target.mode === 'ids' && target.productIds.length === 0) {
      return fail('هیچ محصولی انتخاب نشده است.');
    }

    const tagScope =
      target.mode === 'ids' ? [...new Set(target.productIds)] : ('all-matching' as const);

    switch (action.op) {
      case 'category': {
        const category = await prisma.category.findUnique({ where: { id: action.categoryId } });
        if (!category) return fail('دسته‌بندی انتخاب‌شده معتبر نیست.');
        const result = await prisma.product.updateMany({
          where,
          data: { categoryId: action.categoryId },
        });
        if (result.count === 0) return fail('هیچ محصولی انتخاب نشده است.');
        touchProductTags(tagScope);
        return ok({ count: result.count });
      }
      case 'brand': {
        const brand = await prisma.partsBrand.findUnique({ where: { id: action.partsBrandId } });
        if (!brand) return fail('برند انتخاب‌شده معتبر نیست.');
        const result = await prisma.product.updateMany({
          where,
          data: { partsBrandId: action.partsBrandId },
        });
        if (result.count === 0) return fail('هیچ محصولی انتخاب نشده است.');
        touchProductTags(tagScope);
        return ok({ count: result.count });
      }
      case 'vehicleType': {
        const carModel = await prisma.carModel.findUnique({ where: { id: action.carModelId } });
        if (!carModel) return fail('نوع خودرو انتخاب‌شده معتبر نیست.');

        const rows = await prisma.product.findMany({ where, select: { id: true } });
        const ids = rows.map((r) => r.id);
        if (ids.length === 0) return fail('هیچ محصولی انتخاب نشده است.');

        await prisma.$transaction(async (tx) => {
          await tx.productCompatibility.deleteMany({ where: { productId: { in: ids } } });
          await tx.productCompatibility.createMany({
            data: ids.map((productId) => ({
              productId,
              carModelId: action.carModelId,
            })),
            skipDuplicates: true,
          });
        });

        touchProductTags(tagScope === 'all-matching' ? 'all-matching' : ids);
        return ok({ count: ids.length });
      }
      case 'wholesaleDiscount': {
        const value = clampPct(action.value, 0, 100);
        if (value === null) return fail('درصد تخفیف عمده باید بین ۰ تا ۱۰۰ باشد.');
        const result = await prisma.product.updateMany({
          where,
          data: { wholesaleDiscountPct: value },
        });
        if (result.count === 0) return fail('هیچ محصولی انتخاب نشده است.');
        touchProductTags(tagScope);
        return ok({ count: result.count });
      }
      case 'retailDiscount': {
        const value = clampPct(action.value, 0, 100);
        if (value === null) return fail('درصد تخفیف تک‌فروشی باید بین ۰ تا ۱۰۰ باشد.');
        const result = await prisma.product.updateMany({
          where,
          data: { retailDiscountPct: value },
        });
        if (result.count === 0) return fail('هیچ محصولی انتخاب نشده است.');
        touchProductTags(tagScope);
        return ok({ count: result.count });
      }
      case 'retailPriceDiff': {
        const value = clampPct(action.value, 0, 100);
        if (value === null) return fail('درصد اختلاف قیمت باید بین ۰ تا ۱۰۰ باشد.');
        const result = await prisma.product.updateMany({
          where,
          data: { retailPriceDiffPct: value },
        });
        if (result.count === 0) return fail('هیچ محصولی انتخاب نشده است.');
        touchProductTags(tagScope);
        return ok({ count: result.count });
      }
      case 'setActive': {
        const result = await prisma.product.updateMany({
          where,
          data: { isActive: action.isActive },
        });
        if (result.count === 0) return fail('هیچ محصولی انتخاب نشده است.');
        touchProductTags(tagScope);
        return ok({ count: result.count });
      }
      case 'setOffer': {
        const result = await prisma.product.updateMany({
          where,
          data: { isOffer: action.isOffer },
        });
        if (result.count === 0) return fail('هیچ محصولی انتخاب نشده است.');
        touchProductTags(tagScope);
        return ok({ count: result.count });
      }
      default:
        return fail('عملیات گروهی نامعتبر است.');
    }
  });
}

const MAX_PRODUCT_IMAGE_BYTES = 2_000_000;
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Uploads a product main image and returns its public URL (`/storage/products/…`). */
export async function uploadProductImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  return runMutation('uploadProductImage', async () => {
    const file = formData.get('image');
    if (!(file instanceof File) || file.size === 0) return fail('فایلی انتخاب نشد.');
    const ext = ALLOWED_IMAGE_TYPES[file.type];
    if (!ext) return fail('فرمت تصویر باید jpg، png یا webp باشد.');
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) return fail('حجم تصویر باید کمتر از ۲ مگابایت باشد.');

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${crypto.randomUUID()}.${ext}`;
    const url = await saveFile('products', filename, buffer);
    return ok({ url });
  });
}
