import type { Prisma } from '@/generated/prisma_client';
import { prisma } from '@/src/lib/prisma';
import { plainText, siteUrl } from '@/src/lib/seo';
import { resolveProductPrice } from '@/src/lib/pricing';
import {
  TOROB_API_VERSION,
  TOROB_PAGE_SIZE,
  type TorobProduct,
  type TorobProductRequest,
  type TorobProductResponse,
} from '@/src/lib/torob/types';

const torobProductSelect = {
  id: true,
  sku: true,
  name: true,
  wholesalePrice: true,
  wholesaleDiscountPct: true,
  retailPriceDiffPct: true,
  retailDiscountPct: true,
  stock: true,
  origin: true,
  unit: true,
  mainImage: true,
  description: true,
  metaDescription: true,
  createdAt: true,
  updatedAt: true,
  partsBrand: { select: { name: true } },
  category: { select: { name: true } },
  images: {
    select: { url: true },
    orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
  },
  compatibilities: {
    select: { carModel: { select: { name: true } } },
    orderBy: { carModelId: 'asc' as const },
  },
} satisfies Prisma.ProductSelect;

export type TorobProductSource = Prisma.ProductGetPayload<{
  select: typeof torobProductSelect;
}>;

const eligibleWhere = {
  isActive: true,
  // Torob is a public retail channel; products deliberately hiding their
  // public retail price cannot be represented truthfully in its required feed.
  callForPriceRetail: false,
} satisfies Prisma.ProductWhereInput;

function absoluteHttpUrl(value: string, baseUrl: string): string | null {
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function productIdFromPageUrl(pageUrl: string, baseUrl: string): string | null {
  try {
    const url = new URL(pageUrl);
    const base = new URL(baseUrl);
    if (url.origin !== base.origin) return null;
    const match = url.pathname.match(/^\/products\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function toTorobProduct(row: TorobProductSource, baseUrl = siteUrl('/')): TorobProduct {
  const price = resolveProductPrice(row, 'RETAIL');
  const availability = row.stock > 0;
  const images = unique(
    [row.mainImage, ...row.images.map((image) => image.url)]
      .filter((url): url is string => Boolean(url?.trim()))
      .map((url) => absoluteHttpUrl(url, baseUrl))
      .filter((url): url is string => url !== null && url.length <= 1000),
  );

  const spec: Record<string, string | number> = {
    'برند': row.partsBrand.name,
    'کد کالا': row.sku,
    'واحد فروش': row.unit,
  };
  if (row.origin?.trim()) spec['کشور سازنده'] = row.origin.trim();
  const compatibleCars = unique(
    row.compatibilities.map(({ carModel }) => carModel.name.trim()).filter(Boolean),
  );
  if (compatibleCars.length > 0) spec['خودروهای سازگار'] = compatibleCars.join('، ');

  const shortDescription =
    plainText(row.description, 500) || plainText(row.metaDescription, 500);
  const result: TorobProduct = {
    page_unique: row.id,
    page_url: new URL(`/products/${encodeURIComponent(row.id)}`, baseUrl).toString(),
    title: row.name.slice(0, 500),
    current_price: availability ? price.finalPrice : 0,
    availability,
    category_name: row.category.name.slice(0, 200),
    image_links: images.slice(0, 20),
    spec,
    date_added: row.createdAt.toISOString(),
    date_updated: row.updatedAt.toISOString(),
  };

  if (availability && price.discountPct > 0 && price.basePrice > price.finalPrice) {
    result.old_price = price.basePrice;
  }
  if (shortDescription) result.short_desc = shortDescription;

  return result;
}

function response(
  products: TorobProduct[],
  total: number,
  currentPage: number,
): TorobProductResponse {
  return {
    api_version: TOROB_API_VERSION,
    current_page: currentPage,
    total,
    max_pages: Math.max(1, Math.ceil(total / TOROB_PAGE_SIZE)),
    products,
  };
}

export async function getTorobProductResponse(
  request: TorobProductRequest,
): Promise<TorobProductResponse> {
  const baseUrl = siteUrl('/');

  if (request.kind === 'page') {
    const orderField = request.sort === 'date_added_desc' ? 'createdAt' : 'updatedAt';
    const [total, rows] = await prisma.$transaction([
      prisma.product.count({ where: eligibleWhere }),
      prisma.product.findMany({
        where: eligibleWhere,
        select: torobProductSelect,
        orderBy: [{ [orderField]: 'desc' }, { id: 'desc' }],
        skip: (request.page - 1) * TOROB_PAGE_SIZE,
        take: TOROB_PAGE_SIZE,
      }),
    ]);
    return response(rows.map((row) => toTorobProduct(row, baseUrl)), total, request.page);
  }

  const requestedIds =
    request.kind === 'uniques'
      ? unique(request.pageUniques)
      : unique(
          request.pageUrls
            .map((pageUrl) => productIdFromPageUrl(pageUrl, baseUrl))
            .filter((id): id is string => id !== null),
        );
  if (requestedIds.length === 0) return response([], 0, 1);

  const rows = await prisma.product.findMany({
    where: { ...eligibleWhere, id: { in: requestedIds } },
    select: torobProductSelect,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const products = requestedIds
    .map((id) => byId.get(id))
    .filter((row): row is TorobProductSource => row !== undefined)
    .map((row) => toTorobProduct(row, baseUrl));

  return response(products, products.length, 1);
}
