/**
 * View-model types + serializers.
 * ───────────────────────────────
 * Prisma rows carry `BigInt` (prices), `Decimal` (ratings) and `Date` values
 * that are NOT serializable across the `use cache` / RSC boundary. Every value
 * returned from a Server Action is mapped through the helpers below into plain
 * JSON-safe view-models whose field names match what the existing UI components
 * already consume.
 *
 * Pricing: products store wholesale + retail tier fields; `toProductVM` embeds
 * the raw fields and defaults display to retail. Call `applyRoleToProduct` at
 * request time when the viewer's role is known (wholesale partners, cart, etc.).
 */

import type { Prisma, OrderStatus, PaymentMethod, PaymentStatus } from '@/generated/prisma_client';
import { resolveProductPrice, type ProductPriceFields } from '@/src/lib/pricing';
import { isCallForPriceForRole } from '@/src/lib/call-for-price';
import { orderQuantityCapForRole } from '@/src/lib/order-quantity';
import type { PricingRole } from '@/src/lib/user-role';

// ── Prisma query shapes ─────────────────────────────────────────────────────

export const productInclude = {
  partsBrand: true,
  category: true,
  images: true,
  compatibilities: { include: { carModel: { include: { carBrand: true } } } },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

// ── View-model types (id is the DB cuid → string) ───────────────────────────

export interface ProductVM {
  id: string;
  name: string;
  partsBrandId: number;
  /** @deprecated Prefer `carModelIds` — kept as first id for legacy callers. */
  carModelId: number;
  /** All compatible car model ids. */
  carModelIds: number[];
  categoryId: number;
  /** Payable unit price for the viewer's role. */
  price: number;
  /** List price before discount — shown struck-through when discount > 0. */
  oldPrice?: number;
  /** Active discount percent for the viewer's role. */
  discount?: number;
  /** Raw pricing fields — used to re-resolve when role is known after cache. */
  wholesalePrice: number;
  wholesaleDiscountPct: number;
  retailPriceDiffPct: number;
  retailDiscountPct: number;
  /** Admin flags — used to re-resolve call-for-price when role is known after cache. */
  callForPriceRetail: boolean;
  callForPriceWholesale: boolean;
  /** True when this viewer must call for price (no purchase). */
  callForPrice: boolean;
  mainImage: string;
  images: string[];
  isOffer: boolean;
  sku: string;
  origin: string;
  stock: number;
  /** UI cap for add-to-cart qty; null = unlimited (wholesale). */
  orderQuantityCap: number | null;
  salesCount: number;
  viewCount: number;
  createdDate: string; // ISO yyyy-mm-dd
  isNew: boolean; // true when added within the last 3 days (computed server-side)
  rating: number;
  reviewCount: number;
  brand: string; // partsBrand.name (display)
  brandSlug: string; // partsBrand.slug (URL / filter)
  /** Joined compatible model names for compact display (“مدل خودرو”). */
  carType: string;
  /** Compatible car model names (for filters / multi display). */
  carTypes: string[];
  /** First compatible car brand name (“برند خودرو”). */
  carBrand: string;
  /** First compatible car brand slug (URL / filter). */
  carBrandSlug: string;
  /** All unique compatible car brand slugs (PLP filter). */
  carBrandSlugs: string[];
  /** Full compatibility rows for PDP listing. */
  compatibleCars: { id: number; name: string; brandName: string; brandSlug: string }[];
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
  /** Public shop reply shown under the review on the PDP, if any. */
  adminReply: string | null;
  adminReplyDate: string | null;
}

export interface PDPProductVM extends ProductVM {
  unit: string;
  isOriginal: boolean;
  description: string;
}

export interface CategoryVM {
  id: number;
  key: string;
  name: string;
  image: string;
  count: number;
}

/** Vehicle brand (“برند خودرو”) — parent taxonomy, e.g. ایران خودرو. */
export interface CarBrandVM {
  id: number;
  name: string;
  image: string;
  count: number;
}

/** Vehicle model (“مدل خودرو”) — specific fitment, e.g. پژو ۲۰۶. */
export interface CarModelVM {
  id: number;
  brandId: number;
  brandName: string;
  name: string;
  image: string;
}

export interface NavLinkVM {
  id: number;
  href: string;
  label: string;
  order: number;
}

export interface AdminNavLinkVM extends NavLinkVM {
  isActive: boolean;
}

export type FooterLinkGroupVM = 'QUICK' | 'CATEGORY';

export interface FooterLinkVM {
  id: number;
  group: FooterLinkGroupVM;
  href: string;
  label: string;
  order: number;
}

export interface AdminFooterLinkVM extends FooterLinkVM {
  isActive: boolean;
}

export interface FooterTrustBadgeVM {
  icon: string;
  title: string;
  desc: string;
}

/** Default footer trust badges — used when DB slots are empty (backward compatible). */
export const DEFAULT_FOOTER_TRUST_BADGES: FooterTrustBadgeVM[] = [
  { icon: '🛡️', title: 'ضمانت اصالت کالا', desc: 'تمام محصولات اصلی' },
  { icon: '🚚', title: 'ارسال سریع', desc: 'به سراسر کشور' },
  { icon: '↩️', title: 'بازگشت آسان', desc: 'تا ۷ روز ضمانت برگشت' },
  { icon: '🎧', title: 'پشتیبانی ۲۴/۷', desc: 'همیشه در کنار شما' },
];

export interface PublicSiteSettingsVM {
  retailPhone1: string;
  retailPhone2: string;
  wholesalePhone1: string;
  wholesalePhone2: string;
  wholesalePhone3: string;
  wholesalePhone4: string;
  email: string;
  address: string;
  workingHours: string;
  headerPromo1: string;
  headerPromo2: string;
  headerPromo1Icon: string;
  headerPromo2Icon: string;
  aboutText: string;
  footerTrustBadges: FooterTrustBadgeVM[];
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  appleTouchIconUrl: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  copyrightText: string;
  analyticsId: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  searchConsoleVerification: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

export interface SocialLinkVM {
  id: number;
  label: string;
  url: string;
  icon: string;
  order: number;
}

export interface AdminSocialLinkVM extends SocialLinkVM {
  isActive: boolean;
}

export interface HeroContentVM {
  title: string;
  description: string;
  button1Text: string;
  button1Href: string;
  button2Text: string;
  button2Href: string;
}

export interface HeroBannerVM {
  id: number;
  imageUrl: string;
  order: number;
}

export interface AdminHeroBannerVM extends HeroBannerVM {
  isActive: boolean;
}

export interface ShippingOptionVM {
  id: string;
  method: string;
  label: string;
  description: string;
  cost: number;
}

export interface AdminShippingOptionVM extends ShippingOptionVM {
  isActive: boolean;
}

export interface FaqVM {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface PostVM {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  author: string;
  tags: string[];
  readTime: number;
  publishedAt: string; // Persian locale date
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
}

export interface PostDetailVM extends PostVM {
  body: string; // HTML — admin-authored
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
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
  /** True when this viewer must call for price (should not be purchasable). */
  callForPrice: boolean;
}

export interface CartVM {
  id: string;
  items: CartItemVM[];
  subtotal: number;
  totalItems: number;
}

/** Cart mutation response — may include a retail stock-cap flag for client toasts. */
export interface CartMutationVM extends CartVM {
  stockCapped?: boolean;
  maxStock?: number;
}

export interface OrderSummaryVM {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdDate: string;
}

/** Order detail shown on the payment result page (success/fail landing). */
export interface OrderConfirmationVM {
  id: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  itemCount: number;
  createdDate: string;
}

export interface OrderReceiptItemVM {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/** Full transaction detail rendered on the printable receipt page. */
export interface OrderReceiptVM {
  id: string;
  createdDate: string; // Persian date + time
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName: string;
  phoneNumber: string;
  address: {
    province: string;
    city: string;
    street: string;
    postalCode: string;
  };
  items: OrderReceiptItemVM[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  discountCode: string | null;
  totalAmount: number;
}

/** A city option nested under its province, for the cascading address selects. */
export interface CityOptionVM {
  id: number;
  name: string;
}

/** Seeded reference data backing the province/city dropdowns. */
export interface ProvinceVM {
  id: number;
  name: string;
  cities: CityOptionVM[];
}

/**
 * Contact + delivery details collected on the checkout page. Persisted to the
 * user's profile / default address at order time (see `submitCheckout`), so a
 * first-time buyer's empty profile is filled in and later edits are saved.
 */
export interface CheckoutContact {
  firstName: string;
  lastName: string;
  provinceId: number | null;
  cityId: number | null;
  street: string;
  postalCode: string;
}

export interface CheckoutInput {
  shippingOptionId: string;
  paymentMethod: PaymentMethod;
  contact: CheckoutContact;
  notes?: string;
  /** Optional redeemable coupon code entered at checkout. */
  discountCode?: string;
}

/** Pre-fill payload for the checkout form — the user's saved profile/address. */
export interface CheckoutProfileVM extends CheckoutContact {
  /** Account phone — verified at signup, always read-only on checkout. */
  phoneNumber: string;
  /** true when the user already has a saved delivery address row. */
  hasSavedAddress: boolean;
  /** true when name + full address are all present (no forced edit needed). */
  isComplete: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const FALLBACK_IMAGE = '/logo.png';

/** `/logo.png` is the legacy placeholder and should follow the configured logo too. */
function catalogImage(image: string | null | undefined, fallbackImage: string): string {
  const value = image?.trim();
  return !value || value === FALLBACK_IMAGE ? fallbackImage : value;
}

function persianDate(d: Date): string {
  return d.toLocaleDateString('fa-IR');
}

// ── Product ─────────────────────────────────────────────────────────────────

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function pricingFieldsFromProduct(p: {
  wholesalePrice: bigint;
  wholesaleDiscountPct: Prisma.Decimal;
  retailPriceDiffPct: Prisma.Decimal;
  retailDiscountPct: Prisma.Decimal;
}): ProductPriceFields {
  return {
    wholesalePrice: p.wholesalePrice,
    wholesaleDiscountPct: p.wholesaleDiscountPct,
    retailPriceDiffPct: p.retailPriceDiffPct,
    retailDiscountPct: p.retailDiscountPct,
  };
}

/** Apply role-specific list / final / discount onto an existing ProductVM. */
export function applyRoleToProduct(vm: ProductVM, role: PricingRole): ProductVM {
  const callForPrice = isCallForPriceForRole(
    {
      callForPriceRetail: vm.callForPriceRetail,
      callForPriceWholesale: vm.callForPriceWholesale,
    },
    role,
  );
  const resolved = resolveProductPrice(
    {
      wholesalePrice: vm.wholesalePrice,
      wholesaleDiscountPct: vm.wholesaleDiscountPct,
      retailPriceDiffPct: vm.retailPriceDiffPct,
      retailDiscountPct: vm.retailDiscountPct,
    },
    role,
  );
  return {
    ...vm,
    callForPrice,
    price: resolved.finalPrice,
    oldPrice: callForPrice
      ? undefined
      : resolved.discountPct > 0
        ? resolved.basePrice
        : undefined,
    discount: callForPrice
      ? undefined
      : resolved.discountPct > 0
        ? Math.round(resolved.discountPct)
        : undefined,
    orderQuantityCap: orderQuantityCapForRole(vm.stock, role),
  };
}

export function applyRoleToProducts(vms: ProductVM[], role: PricingRole): ProductVM[] {
  return vms.map((vm) => applyRoleToProduct(vm, role));
}

export function toProductVM(
  p: ProductWithRelations,
  role: PricingRole = null,
  fallbackImage = FALLBACK_IMAGE,
): ProductVM {
  const fields = pricingFieldsFromProduct(p);
  const resolved = resolveProductPrice(fields, role);
  const callForPriceRetail = p.callForPriceRetail;
  const callForPriceWholesale = p.callForPriceWholesale;
  const callForPrice = isCallForPriceForRole(
    { callForPriceRetail, callForPriceWholesale },
    role,
  );

  const compatibleCars = p.compatibilities.map((c) => ({
    id: c.carModel.id,
    name: c.carModel.name,
    brandName: c.carModel.carBrand.name,
    brandSlug: c.carModel.carBrand.slug,
  }));
  const firstModel = compatibleCars[0];
  const carTypes = compatibleCars.map((c) => c.name);
  const carBrandSlugs = [...new Set(compatibleCars.map((c) => c.brandSlug))];
  const gallery = [...p.images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => img.url);
  const uniqueGallery = [
    ...(p.mainImage ? [p.mainImage] : []),
    ...gallery.filter((url) => url !== p.mainImage),
  ];

  return {
    id: p.id,
    name: p.name,
    partsBrandId: p.partsBrandId,
    carModelId: firstModel?.id ?? 0,
    carModelIds: compatibleCars.map((c) => c.id),
    categoryId: p.categoryId,
    price: resolved.finalPrice,
    oldPrice: callForPrice
      ? undefined
      : resolved.discountPct > 0
        ? resolved.basePrice
        : undefined,
    discount: callForPrice
      ? undefined
      : resolved.discountPct > 0
        ? Math.round(resolved.discountPct)
        : undefined,
    wholesalePrice: Number(p.wholesalePrice),
    wholesaleDiscountPct: Number(p.wholesaleDiscountPct),
    retailPriceDiffPct: Number(p.retailPriceDiffPct),
    retailDiscountPct: Number(p.retailDiscountPct),
    callForPriceRetail,
    callForPriceWholesale,
    callForPrice,
    mainImage: catalogImage(p.mainImage, fallbackImage),
    images: uniqueGallery.length > 0
      ? uniqueGallery.map((url) => catalogImage(url, fallbackImage))
      : [catalogImage(p.mainImage, fallbackImage)],
    isOffer: p.isOffer,
    sku: p.sku,
    origin: p.origin ?? '',
    stock: p.stock,
    orderQuantityCap: orderQuantityCapForRole(p.stock, role),
    salesCount: p.saleCount,
    viewCount: p.viewCount,
    createdDate: p.createdAt.toISOString().slice(0, 10),
    isNew: Date.now() - p.createdAt.getTime() <= THREE_DAYS_MS,
    rating: Number(p.ratingAvg),
    reviewCount: p.reviewCount,
    brand: p.partsBrand.name,
    brandSlug: p.partsBrand.slug,
    carType: carTypes.join('، '),
    carTypes,
    carBrand: firstModel?.brandName ?? '',
    carBrandSlug: firstModel?.brandSlug ?? '',
    carBrandSlugs,
    compatibleCars,
    category: p.category.key,
    categoryLabel: p.category.name,
  };
}

export function toPDPProductVM(
  p: ProductWithRelations,
  role: PricingRole = null,
  fallbackImage = FALLBACK_IMAGE,
): PDPProductVM {
  return {
    ...toProductVM(p, role, fallbackImage),
    unit: p.unit?.trim() || 'عدد',
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
  adminReply?: string | null;
  repliedAt?: Date | null;
}): ReviewVM {
  return {
    id: r.id,
    author: r.authorName,
    date: persianDate(r.createdAt),
    rating: r.rating,
    text: r.text,
    verified: r.isVerifiedPurchase,
    adminReply: r.adminReply ?? null,
    adminReplyDate: r.repliedAt ? persianDate(r.repliedAt) : null,
  };
}

// ── Taxonomy ────────────────────────────────────────────────────────────────

export function toCategoryVM(c: {
  id: number;
  key: string;
  name: string;
  image: string;
  productCount: number;
}, fallbackImage = FALLBACK_IMAGE): CategoryVM {
  return {
    id: c.id,
    key: c.key,
    name: c.name,
    image: catalogImage(c.image, fallbackImage),
    count: c.productCount,
  };
}

export function toCarBrandVM(b: {
  id: number;
  name: string;
  logoImage: string | null;
  productCount: number;
}, fallbackImage = FALLBACK_IMAGE): CarBrandVM {
  return {
    id: b.id,
    name: b.name,
    image: catalogImage(b.logoImage, fallbackImage),
    count: b.productCount,
  };
}

export function toCarModelVM(m: {
  id: number;
  carBrandId: number;
  name: string;
  image: string | null;
  carBrand: { name: string };
}, fallbackImage = FALLBACK_IMAGE): CarModelVM {
  return {
    id: m.id,
    brandId: m.carBrandId,
    brandName: m.carBrand.name,
    name: m.name,
    image: catalogImage(m.image, fallbackImage),
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

export function toAdminNavLinkVM(n: {
  id: number;
  href: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}): AdminNavLinkVM {
  return { id: n.id, href: n.href, label: n.label, order: n.sortOrder, isActive: n.isActive };
}

export function toFooterLinkVM(n: {
  id: number;
  group: FooterLinkGroupVM;
  href: string;
  label: string;
  sortOrder: number;
}): FooterLinkVM {
  return {
    id: n.id,
    group: n.group,
    href: n.href,
    label: n.label,
    order: n.sortOrder,
  };
}

export function toAdminFooterLinkVM(n: {
  id: number;
  group: FooterLinkGroupVM;
  href: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}): AdminFooterLinkVM {
  return {
    id: n.id,
    group: n.group,
    href: n.href,
    label: n.label,
    order: n.sortOrder,
    isActive: n.isActive,
  };
}

type SiteSettingTrustFields = {
  footerTrust1Icon: string | null;
  footerTrust1Title: string | null;
  footerTrust1Desc: string | null;
  footerTrust2Icon: string | null;
  footerTrust2Title: string | null;
  footerTrust2Desc: string | null;
  footerTrust3Icon: string | null;
  footerTrust3Title: string | null;
  footerTrust3Desc: string | null;
  footerTrust4Icon: string | null;
  footerTrust4Title: string | null;
  footerTrust4Desc: string | null;
};

function mapFooterTrustBadge(
  icon: string | null | undefined,
  title: string | null | undefined,
  desc: string | null | undefined,
  fallback: FooterTrustBadgeVM,
): FooterTrustBadgeVM {
  const trimmedTitle = title?.trim() ?? '';
  const trimmedIcon = icon?.trim() ?? '';
  const trimmedDesc = desc?.trim() ?? '';
  if (!trimmedTitle && !trimmedIcon && !trimmedDesc) return { ...fallback };
  return {
    icon: trimmedIcon || fallback.icon,
    title: trimmedTitle || fallback.title,
    desc: trimmedDesc || fallback.desc,
  };
}

export function toFooterTrustBadgesVM(
  row: Partial<SiteSettingTrustFields> | null | undefined,
): FooterTrustBadgeVM[] {
  const [d1, d2, d3, d4] = DEFAULT_FOOTER_TRUST_BADGES;
  return [
    mapFooterTrustBadge(row?.footerTrust1Icon, row?.footerTrust1Title, row?.footerTrust1Desc, d1),
    mapFooterTrustBadge(row?.footerTrust2Icon, row?.footerTrust2Title, row?.footerTrust2Desc, d2),
    mapFooterTrustBadge(row?.footerTrust3Icon, row?.footerTrust3Title, row?.footerTrust3Desc, d3),
    mapFooterTrustBadge(row?.footerTrust4Icon, row?.footerTrust4Title, row?.footerTrust4Desc, d4),
  ];
}

export function footerTrustBadgesToDbFields(badges: FooterTrustBadgeVM[] | undefined) {
  const [b1, b2, b3, b4] = [
    badges?.[0],
    badges?.[1],
    badges?.[2],
    badges?.[3],
  ];
  return {
    footerTrust1Icon: b1?.icon?.trim() || null,
    footerTrust1Title: b1?.title?.trim() || null,
    footerTrust1Desc: b1?.desc?.trim() || null,
    footerTrust2Icon: b2?.icon?.trim() || null,
    footerTrust2Title: b2?.title?.trim() || null,
    footerTrust2Desc: b2?.desc?.trim() || null,
    footerTrust3Icon: b3?.icon?.trim() || null,
    footerTrust3Title: b3?.title?.trim() || null,
    footerTrust3Desc: b3?.desc?.trim() || null,
    footerTrust4Icon: b4?.icon?.trim() || null,
    footerTrust4Title: b4?.title?.trim() || null,
    footerTrust4Desc: b4?.desc?.trim() || null,
  };
}

export function toPublicSiteSettingsVM(row: {
  retailPhone1: string | null;
  retailPhone2: string | null;
  wholesalePhone1: string | null;
  wholesalePhone2: string | null;
  wholesalePhone3: string | null;
  wholesalePhone4: string | null;
  email: string | null;
  address: string | null;
  workingHours: string | null;
  headerPromo1: string | null;
  headerPromo2: string | null;
  headerPromo1Icon?: string | null;
  headerPromo2Icon?: string | null;
  aboutText: string | null;
  siteName?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  appleTouchIconUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  copyrightText?: string | null;
  analyticsId?: string | null;
  googleAnalyticsId?: string | null;
  googleTagManagerId?: string | null;
  searchConsoleVerification?: string | null;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
} & Partial<SiteSettingTrustFields> | null): PublicSiteSettingsVM {
  return {
    retailPhone1: row?.retailPhone1 ?? '',
    retailPhone2: row?.retailPhone2 ?? '',
    wholesalePhone1: row?.wholesalePhone1 ?? '',
    wholesalePhone2: row?.wholesalePhone2 ?? '',
    wholesalePhone3: row?.wholesalePhone3 ?? '',
    wholesalePhone4: row?.wholesalePhone4 ?? '',
    email: row?.email ?? '',
    address: row?.address ?? '',
    workingHours: row?.workingHours ?? '',
    headerPromo1: row?.headerPromo1 ?? '',
    headerPromo2: row?.headerPromo2 ?? '',
    headerPromo1Icon: row?.headerPromo1Icon ?? '',
    headerPromo2Icon: row?.headerPromo2Icon ?? '',
    aboutText: row?.aboutText ?? '',
    footerTrustBadges: toFooterTrustBadgesVM(row),
    siteName: row?.siteName ?? '',
    logoUrl: row?.logoUrl ?? '',
    faviconUrl: row?.faviconUrl ?? '',
    appleTouchIconUrl: row?.appleTouchIconUrl ?? '',
    metaTitle: row?.metaTitle ?? '',
    metaDescription: row?.metaDescription ?? '',
    ogImageUrl: row?.ogImageUrl ?? '',
    copyrightText: row?.copyrightText ?? '',
    analyticsId: row?.analyticsId ?? '',
    googleAnalyticsId: row?.googleAnalyticsId ?? '',
    googleTagManagerId: row?.googleTagManagerId ?? '',
    searchConsoleVerification: row?.searchConsoleVerification ?? '',
    robotsIndex: row?.robotsIndex ?? true,
    robotsFollow: row?.robotsFollow ?? true,
  };
}

export function toSocialLinkVM(s: {
  id: number;
  label: string;
  url: string;
  icon: string;
  sortOrder: number;
}): SocialLinkVM {
  return { id: s.id, label: s.label, url: s.url, icon: s.icon, order: s.sortOrder };
}

export function toAdminSocialLinkVM(s: {
  id: number;
  label: string;
  url: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}): AdminSocialLinkVM {
  return {
    id: s.id,
    label: s.label,
    url: s.url,
    icon: s.icon,
    order: s.sortOrder,
    isActive: s.isActive,
  };
}

export function toHeroContentVM(row: {
  heroTitle?: string | null;
  heroDescription?: string | null;
  heroButton1Text?: string | null;
  heroButton1Href?: string | null;
  heroButton2Text?: string | null;
  heroButton2Href?: string | null;
} | null): HeroContentVM {
  return {
    title: row?.heroTitle ?? '',
    description: row?.heroDescription ?? '',
    button1Text: row?.heroButton1Text ?? '',
    button1Href: row?.heroButton1Href ?? '',
    button2Text: row?.heroButton2Text ?? '',
    button2Href: row?.heroButton2Href ?? '',
  };
}

export function toHeroBannerVM(b: {
  id: number;
  imageUrl: string;
  sortOrder: number;
}): HeroBannerVM {
  return {
    id: b.id,
    imageUrl: b.imageUrl,
    order: b.sortOrder,
  };
}

export function toAdminHeroBannerVM(b: {
  id: number;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}): AdminHeroBannerVM {
  return {
    ...toHeroBannerVM(b),
    isActive: b.isActive,
  };
}

export function toFaqVM(f: {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
}): FaqVM {
  return { id: f.id, question: f.question, answer: f.answer, sortOrder: f.sortOrder };
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

export function toAdminShippingOptionVM(s: {
  id: string;
  method: string;
  label: string;
  description: string | null;
  cost: bigint;
  isActive: boolean;
}): AdminShippingOptionVM {
  return {
    ...toShippingOptionVM(s),
    isActive: s.isActive,
  };
}

// ── Cart ────────────────────────────────────────────────────────────────────

// ── Post ────────────────────────────────────────────────────────────────────

type PostRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  author: string;
  tags: string[];
  readTime: number;
  publishedAt: Date;
  categoryId?: number | null;
  category?: { id: number; slug: string; name: string } | null;
};

export function toPostVM(p: PostRow): PostVM {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    author: p.author,
    tags: p.tags,
    readTime: p.readTime,
    publishedAt: persianDate(p.publishedAt),
    categoryId: p.categoryId ?? p.category?.id ?? null,
    categorySlug: p.category?.slug ?? null,
    categoryName: p.category?.name ?? null,
  };
}

export function toPostDetailVM(
  p: PostRow & {
    body: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaKeywords?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImage?: string | null;
  },
): PostDetailVM {
  return {
    ...toPostVM(p),
    body: p.body,
    metaTitle: p.metaTitle ?? null,
    metaDescription: p.metaDescription ?? null,
    metaKeywords: p.metaKeywords ?? null,
    ogTitle: p.ogTitle ?? null,
    ogDescription: p.ogDescription ?? null,
    ogImage: p.ogImage ?? null,
  };
}

// ── Cart ────────────────────────────────────────────────────────────────────

export function toCartItemVM(
  item: {
    id: string;
    productId: string;
    quantity: number;
    product: ProductWithRelations;
  },
  role: PricingRole = null,
  fallbackImage = FALLBACK_IMAGE,
): CartItemVM {
  const p = toProductVM(item.product, role, fallbackImage);
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
    callForPrice: p.callForPrice,
  };
}
