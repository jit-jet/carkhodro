'use server';

/**
 * Partner cart / invoice-builder Server Actions («سبد خرید» → «ثبت فاکتور»).
 * ──────────────────────────────────────────────────────────────────────────
 * The partner cart is the same per-user `Cart` the storefront uses, re-read here
 * with wholesale pricing applied (list price + role-based discount per line).
 * Writes go through the same `cart_items` table; `submitInvoice` turns the cart
 * into an `Order` (snapshotting the partner's saved address, freezing per-line
 * list price + discount, decrementing stock and clearing the cart).
 *
 * Product lookup for "search & add to invoice" REUSES the existing typo-tolerant
 * pg_trgm search (`searchProducts`) and only enriches the ranked hits with the
 * extra columns the modal shows — it does not introduce a second search.
 *
 * Per-user / dynamic (session cookie) — never cached.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { clearCart } from '@/actions/cart';
import { searchProducts } from '@/actions/search';
import { PAYMENT_TERMS } from '@/src/lib/dashboard-options';
import {
  resolveProductPrice,
  netLineTotal,
  netLineTotalBigInt,
} from '@/src/lib/pricing';
import { pricingFieldsFromProduct } from '@/src/lib/serializers';
import {
  pricingRoleFromUser,
  mergeCartQuantity,
  clampOrderQuantity,
  canUseDashboardCart,
  isProductInStock,
} from '@/src/lib/user-role';
import type { UserRole, Prisma } from '@/generated/prisma_client';
import type {
  DashboardCartVM,
  DashboardCartLineVM,
  InvoiceSearchResultVM,
} from '@/src/lib/dashboard-types';

const EMPTY_CART: DashboardCartVM = { id: '', lines: [], subtotalToman: 0, totalItems: 0 };

const cartArgs = {
  include: {
    items: {
      orderBy: { addedAt: 'asc' as const },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            wholesalePrice: true,
            wholesaleDiscountPct: true,
            retailPriceDiffPct: true,
            retailDiscountPct: true,
            stock: true,
          },
        },
      },
    },
  },
} satisfies Prisma.CartDefaultArgs;

async function loadDashboardCart(userId: string, role: UserRole): Promise<DashboardCartVM> {
  const cart = await prisma.cart.findUnique({ where: { userId }, ...cartArgs });
  if (!cart) return EMPTY_CART;

  const pricingRole = pricingRoleFromUser(role);
  const lines: DashboardCartLineVM[] = cart.items.map((item) => {
    const fields = pricingFieldsFromProduct(item.product);
    const resolved = resolveProductPrice(fields, pricingRole);
    return {
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      name: item.product.name,
      unitPriceToman: resolved.basePrice,
      discountPct: resolved.discountPct,
      quantity: item.quantity,
      stock: item.product.stock,
      lineTotalToman: netLineTotal(resolved.basePrice, item.quantity, resolved.discountPct),
    };
  });

  return {
    id: cart.id,
    lines,
    subtotalToman: lines.reduce((sum, l) => sum + l.lineTotalToman, 0),
    totalItems: lines.reduce((sum, l) => sum + l.quantity, 0),
  };
}

export async function getDashboardCart(): Promise<DashboardCartVM> {
  const user = await getCurrentUser();
  if (!user) return EMPTY_CART;
  return safeQuery('getDashboardCart', () => loadDashboardCart(user.id, user.role), EMPTY_CART);
}

export async function addToInvoice(
  productId: string,
  quantity = 1,
): Promise<ActionResult<DashboardCartVM>> {
  return runMutation('addToInvoice', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای افزودن به فاکتور وارد شوید.');
    if (!canUseDashboardCart(user.role)) {
      return fail('این بخش فقط برای همکاران عمده‌فروشی است.');
    }

    const qty = Math.max(1, Math.round(quantity));
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { stock: true },
    });
    if (!product) return fail('محصول یافت نشد.');
    if (!isProductInStock(product.stock)) return fail('این محصول موجود نیست.');

    const role = pricingRoleFromUser(user.role);

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
      select: { id: true },
    });
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
      select: { quantity: true },
    });
    const nextQty = mergeCartQuantity(existing?.quantity ?? 0, qty, product.stock, role);
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: nextQty },
      update: { quantity: nextQty },
    });

    revalidatePath('/dashboard/cart');
    revalidatePath('/dashboard');
    return ok(await loadDashboardCart(user.id, user.role));
  });
}

export async function setInvoiceLineQty(
  itemId: string,
  quantity: number,
): Promise<ActionResult<DashboardCartVM>> {
  return runMutation('setInvoiceLineQty', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');
    if (!canUseDashboardCart(user.role)) {
      return fail('این بخش فقط برای همکاران عمده‌فروشی است.');
    }

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: user.id } },
      include: { product: { select: { stock: true } } },
    });
    if (!item) return fail('ردیف فاکتور یافت نشد.');
    if (!isProductInStock(item.product.stock)) {
      return fail('این محصول ناموجود است.');
    }

    const role = pricingRoleFromUser(user.role);
    const qty = clampOrderQuantity(Math.round(quantity), item.product.stock, role);
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: qty } });

    revalidatePath('/dashboard/cart');
    return ok(await loadDashboardCart(user.id, user.role));
  });
}

export async function removeInvoiceLines(
  itemIds: string[],
): Promise<ActionResult<DashboardCartVM>> {
  return runMutation('removeInvoiceLines', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');
    if (!canUseDashboardCart(user.role)) {
      return fail('این بخش فقط برای همکاران عمده‌فروشی است.');
    }
    if (itemIds.length === 0) return ok(await loadDashboardCart(user.id, user.role));

    await prisma.cartItem.deleteMany({
      where: { id: { in: itemIds }, cart: { userId: user.id } },
    });

    revalidatePath('/dashboard/cart');
    revalidatePath('/dashboard');
    return ok(await loadDashboardCart(user.id, user.role));
  });
}

/** Map raw product rows to the invoice-modal shape, applying the role discount. */
function toSearchResult(
  rows: {
    id: string;
    sku: string;
    name: string;
    wholesalePrice: bigint;
    wholesaleDiscountPct: Prisma.Decimal;
    retailPriceDiffPct: Prisma.Decimal;
    retailDiscountPct: Prisma.Decimal;
    packQuantity: number;
    cartonQuantity: number;
    stock: number;
  }[],
  role: UserRole,
): InvoiceSearchResultVM[] {
  const pricingRole = pricingRoleFromUser(role);
  return rows.map((r) => {
    const resolved = resolveProductPrice(pricingFieldsFromProduct(r), pricingRole);
    return {
      id: r.id,
      sku: r.sku,
      name: r.name,
      priceToman: resolved.finalPrice,
      discountPct: resolved.discountPct,
      packQuantity: r.packQuantity,
      cartonQuantity: r.cartonQuantity,
      stock: r.stock,
    };
  });
}

const searchSelect = {
  id: true,
  sku: true,
  name: true,
  wholesalePrice: true,
  wholesaleDiscountPct: true,
  retailPriceDiffPct: true,
  retailDiscountPct: true,
  packQuantity: true,
  cartonQuantity: true,
  stock: true,
} satisfies Prisma.ProductSelect;

/**
 * "Search & add to invoice" lookup — reuses the typo-tolerant pg_trgm ranking in
 * `searchProducts`, then hydrates the ranked hits with the pack/carton/discount
 * columns the modal needs (preserving the search ranking order).
 */
export async function searchInvoiceProducts(
  query: string,
): Promise<InvoiceSearchResultVM[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  return safeQuery(
    'searchInvoiceProducts',
    async () => {
      const ranked = await searchProducts(query, 14);
      const ids = ranked.map((p) => p.id);
      if (ids.length === 0) return [];

      const rows = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: searchSelect,
      });
      const byId = new Map(rows.map((r) => [r.id, r]));
      const ordered = ids
        .map((id) => byId.get(id))
        .filter((r): r is NonNullable<typeof r> => r != null);
      return toSearchResult(ordered, user.role);
    },
    [],
  );
}

/** Distinct products the partner has bought before — "add from previous purchases". */
export async function getPreviousPurchaseProducts(): Promise<InvoiceSearchResultVM[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  return safeQuery(
    'getPreviousPurchaseProducts',
    async () => {
      const purchased = await prisma.orderItem.findMany({
        where: { order: { userId: user.id } },
        select: { productId: true },
        distinct: ['productId'],
      });
      const ids = purchased.map((p) => p.productId);
      if (ids.length === 0) return [];

      const rows = await prisma.product.findMany({
        where: { id: { in: ids }, isActive: true },
        select: searchSelect,
        orderBy: { name: 'asc' },
      });
      return toSearchResult(rows, user.role);
    },
    [],
  );
}

/**
 * Place the partner invoice from the current cart («ثبت فاکتور»).
 * One transaction: snapshot the partner's saved delivery address, freeze each
 * line's list price + discount, decrement stock, create the order (status NEW)
 * and clear the cart. Requires a completed profile address.
 */
export async function submitInvoice(input: {
  paymentTerms: string;
  notes?: string;
}): Promise<ActionResult<{ id: string; orderNumber: number }>> {
  return runMutation('submitInvoice', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای ثبت فاکتور وارد شوید.');
    if (!canUseDashboardCart(user.role)) {
      return fail('ثبت فاکتور فقط برای همکاران عمده‌فروشی امکان‌پذیر است.');
    }

    const paymentTerms = (PAYMENT_TERMS as readonly string[]).includes(input.paymentTerms)
      ? input.paymentTerms
      : PAYMENT_TERMS[0];

    const [cart, address, shipping] = await Promise.all([
      prisma.cart.findUnique({
        where: { userId: user.id },
        include: { items: { include: { product: true } } },
      }),
      prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { isDefault: 'desc' },
        include: { city: { include: { province: true } } },
      }),
      prisma.shippingOption.findFirst({
        where: { method: 'STANDARD' },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!cart || cart.items.length === 0) return fail('سبد خرید شما خالی است.');
    if (!address) {
      return fail('برای ثبت فاکتور ابتدا آدرس خود را در «پروفایل من» تکمیل کنید.');
    }
    if (!shipping) return fail('روش ارسالی برای ثبت فاکتور پیدا نشد.');

    for (const item of cart.items) {
      if (!isProductInStock(item.product.stock)) {
        return fail(`«${item.product.name}» ناموجود است.`);
      }
    }

    const pricingRole = pricingRoleFromUser(user.role);
    const lineItems = cart.items.map((item) => {
      const pricing = resolveProductPrice(
        {
          wholesalePrice: item.product.wholesalePrice,
          wholesaleDiscountPct: item.product.wholesaleDiscountPct,
          retailPriceDiffPct: item.product.retailPriceDiffPct,
          retailDiscountPct: item.product.retailDiscountPct,
        },
        pricingRole,
      );
      return {
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        priceAtPurchase: BigInt(pricing.basePrice),
        discountPct: pricing.discountPct,
        quantity: item.quantity,
      };
    });

    const subtotal = lineItems.reduce(
      (sum, l) => sum + netLineTotalBigInt(l.priceAtPurchase, l.quantity, l.discountPct),
      BigInt(0),
    );

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: user.id,
          addressId: address.id,
          shippingOptionId: shipping.id,
          paymentMethod: 'COD',
          paymentTerms,
          status: 'NEW',
          snapshotProvince: address.city.province.name,
          snapshotCity: address.city.name,
          snapshotStreet: address.street,
          snapshotPostalCode: address.postalCode,
          subtotal,
          shippingCost: BigInt(0),
          taxAmount: BigInt(0),
          totalAmount: subtotal,
          notes: input.notes?.trim() || null,
          items: { create: lineItems },
        },
        select: { id: true, orderNumber: true },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            saleCount: { increment: item.quantity },
          },
        });
      }
      return created;
    });

    const cleared = await clearCart();
    if (!cleared.ok) {
      console.error('[submitInvoice] clearCart failed after order creation:', cleared.error);
    }

    revalidatePath('/dashboard/cart');
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');
    return ok(order);
  });
}
