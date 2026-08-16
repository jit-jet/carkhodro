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
import { deleteFile, deleteRemovedFiles, saveFile } from '@/src/lib/storage';
import {
  buildAdminProductWhere,
  type AdminProductWhereFilters,
} from '@/src/lib/admin-product-where';
import { isHesabfaConfigured } from '@/src/lib/hesabfa/client';
import {
  deleteProductFromHesabfa,
  formatHesabfaDeleteError,
  formatHesabfaSaveError,
  pushProductToHesabfa,
  saveProductItemToHesabfa,
} from '@/src/lib/hesabfa/products';
import { syncHesabfaStockToTarget } from '@/src/lib/hesabfa/stock';
import { runHesabfaBackground } from '@/src/lib/hesabfa/sync';
import crypto from 'node:crypto';

export interface ProductInput {
  /** Ignored on create — Hesabfa generates the code used as SKU. */
  sku?: string;
  name: string;
  partsBrandId: number;
  categoryId: number;
  /**
   * Compatible car models (“مدل خودرو”). Empty / omitted-on-create clears
   * compatibility; on update, `undefined` leaves existing rows unchanged.
   */
  carModelIds?: number[];
  wholesalePrice: number;
  /** Optional buy/cost price in Toman (Hesabfa BuyPrice). */
  buyPrice?: number | null;
  wholesaleDiscountPct?: number;
  retailPriceDiffPct?: number;
  retailDiscountPct?: number;
  isOffer?: boolean;
  callForPriceRetail?: boolean;
  callForPriceWholesale?: boolean;
  isActive?: boolean;
  stock?: number;
  origin?: string | null;
  /** Storefront unit label (e.g. عدد). Defaults to «عدد». */
  unit?: string;
  mainImage?: string | null;
  /** Gallery image URLs (including main). Order is preserved as sortOrder. */
  images?: string[];
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  imageAlt?: string | null;
}

function normalizeBuyPrice(value: number | null | undefined): bigint | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return BigInt(Math.round(value));
}

function hesabfaCodeOf(item: { Code?: number | string | null }): string {
  return item.Code != null ? String(item.Code).trim() : '';
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

async function syncProductCompatibilities(
  productId: string,
  carModelIds: number[] | undefined,
) {
  if (carModelIds === undefined) return;

  const uniqueIds = [...new Set(carModelIds.filter((id) => Number.isFinite(id) && id > 0))];
  await prisma.productCompatibility.deleteMany({ where: { productId } });
  if (uniqueIds.length === 0) return;

  const existing = await prisma.carModel.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });
  if (existing.length === 0) return;

  await prisma.productCompatibility.createMany({
    data: existing.map((m) => ({ productId, carModelId: m.id })),
    skipDuplicates: true,
  });
}

async function assertCarModelsExist(carModelIds: number[] | undefined): Promise<string | null> {
  if (carModelIds === undefined) return null;
  const uniqueIds = [...new Set(carModelIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (uniqueIds.length === 0) return null;
  const count = await prisma.carModel.count({ where: { id: { in: uniqueIds } } });
  if (count !== uniqueIds.length) return 'یکی از مدل‌های خودرو انتخاب‌شده معتبر نیست.';
  return null;
}

export async function createProduct(
  input: ProductInput,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('createProduct', async () => {
    if (!input.name?.trim()) {
      return fail('نام محصول الزامی است.');
    }
    if (!(await isHesabfaConfigured())) {
      return fail(
        'Saving product to Hesabfa failed. Please try again. Hesabfa is not configured.',
      );
    }
    const carModelError = await assertCarModelsExist(input.carModelIds);
    if (carModelError) return fail(carModelError);

    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { name: true },
    });
    if (!category) return fail('دسته‌بندی انتخاب‌شده معتبر نیست.');

    const buyPrice = normalizeBuyPrice(input.buyPrice);
    const wholesalePrice = BigInt(Math.round(input.wholesalePrice));
    const wholesaleDiscountPct = input.wholesaleDiscountPct ?? 0;
    const retailPriceDiffPct = input.retailPriceDiffPct ?? 25;
    const retailDiscountPct = input.retailDiscountPct ?? 0;

    let saved;
    try {
      saved = await saveProductItemToHesabfa({
        code: '',
        name: input.name.trim(),
        categoryName: category.name,
        wholesalePrice,
        retailPriceDiffPct,
        retailDiscountPct,
        wholesaleDiscountPct,
        buyPrice,
        description: input.description ?? null,
        active: true,
      });
    } catch (err) {
      return fail(formatHesabfaSaveError(err));
    }

    const code = hesabfaCodeOf(saved);
    if (!code) {
      return fail(
        'Saving product to Hesabfa failed. Please try again. Hesabfa did not return an item code.',
      );
    }

    const targetStock = Math.max(0, Math.round(input.stock ?? 0));
    try {
      await syncHesabfaStockToTarget({
        itemCode: code,
        itemName: input.name.trim(),
        targetStock,
        unitPriceToman: Number(buyPrice ?? wholesalePrice),
        reference: `create:${code}`,
      });
    } catch (err) {
      console.error('[hesabfa:stock:create]', err);
    }

    // Hesabfa owns the SKU. A code can already exist locally after a retried
    // request or when Hesabfa reuses a code that belongs to a stale/soft-deleted
    // row, so make the local write idempotent on that returned code.
    const persisted = await prisma.product.upsert({
      where: { sku: code },
      create: {
        sku: code,
        name: input.name.trim(),
        partsBrandId: input.partsBrandId,
        categoryId: input.categoryId,
        wholesalePrice,
        buyPrice,
        wholesaleDiscountPct,
        retailPriceDiffPct,
        retailDiscountPct,
        isOffer: input.isOffer ?? false,
        callForPriceRetail: input.callForPriceRetail ?? false,
        callForPriceWholesale: input.callForPriceWholesale ?? false,
        stock: targetStock,
        origin: input.origin ?? null,
        unit: input.unit?.trim() || 'عدد',
        mainImage: input.mainImage ?? null,
        description: input.description ?? null,
        ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle?.trim() || null } : {}),
        ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription?.trim() || null } : {}),
        ...(input.imageAlt !== undefined ? { imageAlt: input.imageAlt?.trim() || null } : {}),
        hesabfaCode: code,
        hesabfaId: typeof saved.Id === 'number' ? saved.Id : null,
        lastSyncedAt: new Date(),
      },
      update: {
        name: input.name.trim(),
        partsBrandId: input.partsBrandId,
        categoryId: input.categoryId,
        wholesalePrice,
        buyPrice,
        wholesaleDiscountPct,
        retailPriceDiffPct,
        retailDiscountPct,
        isOffer: input.isOffer ?? false,
        callForPriceRetail: input.callForPriceRetail ?? false,
        callForPriceWholesale: input.callForPriceWholesale ?? false,
        isActive: true,
        stock: targetStock,
        origin: input.origin ?? null,
        unit: input.unit?.trim() || 'عدد',
        mainImage: input.mainImage ?? null,
        description: input.description ?? null,
        ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle?.trim() || null } : {}),
        ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription?.trim() || null } : {}),
        ...(input.imageAlt !== undefined ? { imageAlt: input.imageAlt?.trim() || null } : {}),
        hesabfaCode: code,
        hesabfaId: typeof saved.Id === 'number' ? saved.Id : null,
        lastSyncedAt: new Date(),
      },
      select: { id: true },
    });
    await syncProductImages(persisted.id, input.images);
    await syncProductCompatibilities(persisted.id, input.carModelIds ?? []);
    updateTag(tags.products);
    return ok(persisted);
  });
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('updateProduct', async () => {
    if (!(await isHesabfaConfigured())) {
      return fail(
        'Saving product to Hesabfa failed. Please try again. Hesabfa is not configured.',
      );
    }
    const carModelError = await assertCarModelsExist(input.carModelIds);
    if (carModelError) return fail(carModelError);

    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        images: { select: { url: true } },
      },
    });
    if (!existing) return fail('محصول یافت نشد.');

    const categoryId = input.categoryId ?? existing.categoryId;
    const category =
      categoryId === existing.categoryId
        ? existing.category
        : await prisma.category.findUnique({
            where: { id: categoryId },
            select: { id: true, name: true },
          });
    if (!category) return fail('دسته‌بندی انتخاب‌شده معتبر نیست.');

    const name = input.name !== undefined ? input.name.trim() : existing.name;
    if (!name) return fail('نام محصول الزامی است.');

    const wholesalePrice =
      input.wholesalePrice !== undefined
        ? BigInt(Math.round(input.wholesalePrice))
        : existing.wholesalePrice;
    const buyPrice =
      input.buyPrice !== undefined ? normalizeBuyPrice(input.buyPrice) : existing.buyPrice;
    const wholesaleDiscountPct =
      input.wholesaleDiscountPct !== undefined
        ? input.wholesaleDiscountPct
        : Number(existing.wholesaleDiscountPct);
    const retailPriceDiffPct =
      input.retailPriceDiffPct !== undefined
        ? input.retailPriceDiffPct
        : Number(existing.retailPriceDiffPct);
    const retailDiscountPct =
      input.retailDiscountPct !== undefined
        ? input.retailDiscountPct
        : Number(existing.retailDiscountPct);
    const isActive = input.isActive !== undefined ? input.isActive : existing.isActive;
    const description =
      input.description !== undefined ? input.description : existing.description;

    const hesabfaCode = existing.hesabfaCode?.trim() || existing.sku.trim();

    let saved;
    try {
      saved = await saveProductItemToHesabfa({
        code: hesabfaCode,
        name,
        categoryName: category.name,
        wholesalePrice,
        retailPriceDiffPct,
        retailDiscountPct,
        wholesaleDiscountPct,
        buyPrice,
        description,
        active: isActive,
      });
    } catch (err) {
      return fail(formatHesabfaSaveError(err));
    }

    const code = hesabfaCodeOf(saved) || hesabfaCode;
    const targetStock =
      input.stock !== undefined ? Math.max(0, Math.round(input.stock)) : existing.stock;

    try {
      await syncHesabfaStockToTarget({
        itemCode: code,
        itemName: name,
        targetStock,
        unitPriceToman: Number(buyPrice ?? wholesalePrice),
        reference: `update:${id}`,
      });
    } catch (err) {
      console.error('[hesabfa:stock:update]', err);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        // SKU / Hesabfa code are never edited manually — keep Hesabfa as source of truth.
        sku: code,
        hesabfaCode: code,
        ...(typeof saved.Id === 'number' ? { hesabfaId: saved.Id } : {}),
        lastSyncedAt: new Date(),
        name,
        ...(input.partsBrandId !== undefined ? { partsBrandId: input.partsBrandId } : {}),
        categoryId,
        wholesalePrice,
        buyPrice,
        wholesaleDiscountPct,
        retailPriceDiffPct,
        retailDiscountPct,
        ...(input.isOffer !== undefined ? { isOffer: input.isOffer } : {}),
        ...(input.callForPriceRetail !== undefined
          ? { callForPriceRetail: input.callForPriceRetail }
          : {}),
        ...(input.callForPriceWholesale !== undefined
          ? { callForPriceWholesale: input.callForPriceWholesale }
          : {}),
        isActive,
        ...(input.stock !== undefined ? { stock: targetStock } : {}),
        ...(input.origin !== undefined ? { origin: input.origin } : {}),
        ...(input.unit !== undefined ? { unit: input.unit.trim() || 'عدد' } : {}),
        ...(input.mainImage !== undefined ? { mainImage: input.mainImage } : {}),
        description,
        ...(input.metaTitle !== undefined
          ? { metaTitle: input.metaTitle?.trim() || null }
          : {}),
        ...(input.metaDescription !== undefined
          ? { metaDescription: input.metaDescription?.trim() || null }
          : {}),
        ...(input.imageAlt !== undefined
          ? { imageAlt: input.imageAlt?.trim() || null }
          : {}),
      },
      select: { id: true },
    });
    await syncProductImages(id, input.images);
    await syncProductCompatibilities(id, input.carModelIds);
    if (input.images !== undefined || input.mainImage !== undefined) {
      await deleteRemovedFiles(
        [existing.mainImage, ...existing.images.map((image) => image.url)],
        [
          input.mainImage !== undefined ? input.mainImage : existing.mainImage,
          ...(input.images !== undefined ? input.images : existing.images.map((image) => image.url)),
        ],
      );
    }
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
    runHesabfaBackground('pushProduct:delete', () => pushProductToHesabfa(id));
    return ok(undefined);
  });
}

/**
 * Permanently remove a product from Hesabfa, the local catalogue, and disk.
 * Historical order lines keep their immutable product snapshots.
 */
export async function permanentlyDeleteProduct(id: string): Promise<ActionResult> {
  return runMutation('permanentlyDeleteProduct', async () => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { select: { url: true } },
      },
    });
    if (!product) return fail('محصول یافت نشد.');

    const imageUrls = [
      ...(product.mainImage ? [product.mainImage] : []),
      ...product.images.map((img) => img.url),
    ];
    const uniqueUrls = [...new Set(imageUrls.filter(Boolean))];

    try {
      await deleteProductFromHesabfa(product.hesabfaCode?.trim() || product.sku);
    } catch (err) {
      return fail(formatHesabfaDeleteError(err));
    }

    await prisma.product.delete({ where: { id } });

    await Promise.all(uniqueUrls.map((url) => deleteFile(url)));

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
    runHesabfaBackground('pushProduct:reactivate', () => pushProductToHesabfa(id));
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
  | { op: 'setOffer'; isOffer: boolean }
  | { op: 'setCallForPriceRetail'; callForPriceRetail: boolean }
  | { op: 'setCallForPriceWholesale'; callForPriceWholesale: boolean };

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
        if (!carModel) return fail('مدل خودرو انتخاب‌شده معتبر نیست.');

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
      case 'setCallForPriceRetail': {
        const result = await prisma.product.updateMany({
          where,
          data: { callForPriceRetail: action.callForPriceRetail },
        });
        if (result.count === 0) return fail('هیچ محصولی انتخاب نشده است.');
        touchProductTags(tagScope);
        return ok({ count: result.count });
      }
      case 'setCallForPriceWholesale': {
        const result = await prisma.product.updateMany({
          where,
          data: { callForPriceWholesale: action.callForPriceWholesale },
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
