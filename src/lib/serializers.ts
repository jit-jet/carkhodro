/**
 * View-model types + serializers.
 * ───────────────────────────────
 * Prisma rows carry `BigInt` (prices), `Decimal` (ratings) and `Date` values
 * that are NOT serializable across the `use cache` / RSC boundary. Every value
 * returned from a Server Action is mapped through the helpers below into plain
 * JSON-safe view-models whose field names match what the existing UI components
 * already consume (see `src/data/mockDatabase.ts`).
 *
 * Pricing note: the seed stores the same numeric magnitude the UI was built
 * around (e.g. 85_000), so we expose `Number(basePrice)` directly and the UI
 * keeps rendering it as Toman.
 */

import type { Prisma, OrderStatus, PaymentMethod } from '@/generated/prisma_client';

// ── Prisma query shapes ─────────────────────────────────────────────────────

export const productInclude = {
  partsBrand: true,
  category: true,
  images: true,
  compatibilities: { include: { carModel: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

// ── View-model types (id is the DB cuid → string) ───────────────────────────

export interface ProductVM {
  id: string;
  name: string;
  partsBrandId: number;
  carModelId: number;
  categoryId: number;
  price: number;
  oldPrice?: number;
  discount?: number;
  mainImage: string;
  images: string[];
  isOffer: boolean;
  sku: string;
  warranty: string;
  origin: string;
  stock: number;
  salesCount: number;
  viewCount: number;
  createdDate: string; // ISO yyyy-mm-dd
  isNew: boolean; // true when added within the last 3 days (computed server-side)
  rating: number;
  reviewCount: number;
  brand: string; // partsBrand.name
  carType: string; // first compatible car model name
  category: string; // category.key (filter slug)
  categoryLabel: string; // category.name (display)
}

export interface ReviewVM {
  id: string;
  author: string;
  date: string; // Persian display date
  rating: number;
  text: string;
  verified: boolean;
}

export interface PDPProductVM extends ProductVM {
  packQuantity: number;
  cartonQuantity: number;
  isOriginal: boolean;
  description: string;
}

export interface CategoryVM {
  id: number;
  key: string;
  name: string;
  icon: string;
  count: number;
  color: string;
  bgColor: string;
}

export interface CarBrandVM {
  id: number;
  name: string;
  image: string;
  count: number;
}

export interface CarModelVM {
  id: number;
  brandId: number;
  brandName: string;
  name: string;
  years: string;
  image: string;
}

export interface NavLinkVM {
  id: number;
  href: string;
  label: string;
  order: number;
}

export interface ShippingOptionVM {
  id: string;
  method: string;
  label: string;
  description: string;
  cost: number;
}

export interface CartItemVM {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  image: string;
  quantity: number;
  brand: string;
  stock: number;
}

export interface CartVM {
  id: string;
  items: CartItemVM[];
  subtotal: number;
  totalItems: number;
}

export interface OrderSummaryVM {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdDate: string;
}

export interface CheckoutInput {
  /** Optional — falls back to the user's default (or first) saved address. */
  addressId?: string;
  shippingOptionId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const FALLBACK_IMAGE = '/logo.png';

/** Convert latin digits to Persian for display strings built from numbers. */
function toFa(n: number): string {
  return n.toLocaleString('fa-IR', { useGrouping: false });
}

function persianDate(d: Date): string {
  return d.toLocaleDateString('fa-IR');
}

// ── Product ─────────────────────────────────────────────────────────────────

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function toProductVM(p: ProductWithRelations): ProductVM {
  const price = Number(p.basePrice);
  const oldPrice = p.oldPrice != null ? Number(p.oldPrice) : undefined;
  const discount =
    oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : undefined;

  const firstModel = p.compatibilities[0]?.carModel;
  const gallery = [...p.images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => img.url);

  return {
    id: p.id,
    name: p.name,
    partsBrandId: p.partsBrandId,
    carModelId: firstModel?.id ?? 0,
    categoryId: p.categoryId,
    price,
    oldPrice,
    discount,
    mainImage: p.mainImage ?? FALLBACK_IMAGE,
    images: gallery.length > 0 ? gallery : [p.mainImage ?? FALLBACK_IMAGE],
    isOffer: p.isOffer,
    sku: p.sku,
    warranty: p.warranty ?? '',
    origin: p.origin ?? '',
    stock: p.stock,
    salesCount: p.saleCount,
    viewCount: p.viewCount,
    createdDate: p.createdAt.toISOString().slice(0, 10),
    isNew: Date.now() - p.createdAt.getTime() <= THREE_DAYS_MS,
    rating: Number(p.ratingAvg),
    reviewCount: p.reviewCount,
    brand: p.partsBrand.name,
    carType: firstModel?.name ?? '',
    category: p.category.key,
    categoryLabel: p.category.name,
  };
}

export function toPDPProductVM(p: ProductWithRelations): PDPProductVM {
  return {
    ...toProductVM(p),
    packQuantity: p.packQuantity,
    cartonQuantity: p.cartonQuantity,
    isOriginal: p.isOriginal,
    description: p.description ?? '',
  };
}

// ── Review ──────────────────────────────────────────────────────────────────

export function toReviewVM(r: {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}): ReviewVM {
  return {
    id: r.id,
    author: r.authorName,
    date: persianDate(r.createdAt),
    rating: r.rating,
    text: r.text,
    verified: r.isVerifiedPurchase,
  };
}

// ── Taxonomy ────────────────────────────────────────────────────────────────

export function toCategoryVM(c: {
  id: number;
  key: string;
  name: string;
  icon: string | null;
  productCount: number;
  color: string | null;
  bgColor: string | null;
}): CategoryVM {
  return {
    id: c.id,
    key: c.key,
    name: c.name,
    icon: c.icon ?? '🔧',
    count: c.productCount,
    color: c.color ?? '#6b7280',
    bgColor: c.bgColor ?? '#f3f4f6',
  };
}

export function toCarBrandVM(b: {
  id: number;
  name: string;
  logoImage: string | null;
  productCount: number;
}): CarBrandVM {
  return {
    id: b.id,
    name: b.name,
    image: b.logoImage ?? FALLBACK_IMAGE,
    count: b.productCount,
  };
}

export function toCarModelVM(m: {
  id: number;
  carBrandId: number;
  name: string;
  yearStart: number | null;
  yearEnd: number | null;
  image: string | null;
  carBrand: { name: string };
}): CarModelVM {
  const start = m.yearStart != null ? toFa(m.yearStart) : '';
  const end = m.yearEnd != null ? toFa(m.yearEnd) : 'اکنون';
  return {
    id: m.id,
    brandId: m.carBrandId,
    brandName: m.carBrand.name,
    name: m.name,
    years: start ? `${start} - ${end}` : '',
    image: m.image ?? FALLBACK_IMAGE,
  };
}

export function toNavLinkVM(n: {
  id: number;
  href: string;
  label: string;
  sortOrder: number;
}): NavLinkVM {
  return { id: n.id, href: n.href, label: n.label, order: n.sortOrder };
}

export function toShippingOptionVM(s: {
  id: string;
  method: string;
  label: string;
  description: string | null;
  cost: bigint;
}): ShippingOptionVM {
  return {
    id: s.id,
    method: s.method,
    label: s.label,
    description: s.description ?? '',
    cost: Number(s.cost),
  };
}

// ── Cart ────────────────────────────────────────────────────────────────────

export function toCartItemVM(item: {
  id: string;
  productId: string;
  quantity: number;
  product: ProductWithRelations;
}): CartItemVM {
  const p = toProductVM(item.product);
  return {
    id: item.id,
    productId: item.productId,
    name: p.name,
    sku: p.sku,
    price: p.price,
    image: p.mainImage,
    quantity: item.quantity,
    brand: p.brand,
    stock: p.stock,
  };
}
