'use server';

/**
 * Order Server Actions (checkout + history). File-level `'use server'` so the
 * checkout action can be imported from the Client cart. Per-user / dynamic —
 * never cached.
 *
 * `createOrder` runs a single transaction that: snapshots the delivery address,
 * freezes per-line prices, decrements stock, creates the order, and clears the
 * cart — mirroring the snapshot/immutability intent in the Prisma schema.
 */

import { revalidatePath, updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { tags } from '@/actions/cache-tags';
import type { OrderStatus, Prisma } from '@/generated/prisma_client';
import type {
  OrderSummaryVM,
  OrderConfirmationVM,
  OrderReceiptVM,
  CheckoutInput,
  CheckoutContact,
} from '@/src/lib/serializers';

/**
 * VAT / tax rate applied to the order subtotal at checkout. Kept at 0 so totals
 * match the rest of the app today; set to e.g. 0.09 (Iran VAT) to switch it on —
 * the tax row is wired through the order, summary breakdown and stored totals.
 */
const TAX_RATE = 0;

export async function getUserOrders(): Promise<OrderSummaryVM[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  return safeQuery('getUserOrders', async () => {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { select: { quantity: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      createdDate: o.createdAt.toISOString().slice(0, 10),
    }));
  }, []);
}

/**
 * Fetch a single order for the payment result page. Scoped to the current user
 * so a guessed/forged id can't leak someone else's order. Returns null when the
 * order is missing or not owned by the caller.
 */
export async function getOrderConfirmation(
  id: string,
): Promise<OrderConfirmationVM | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return safeQuery(`getOrderConfirmation:${id}`, async () => {
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { items: { select: { quantity: true } } },
    });
    if (!order) return null;
    return {
      id: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      totalAmount: Number(order.totalAmount),
      itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
      createdDate: order.createdAt.toISOString().slice(0, 10),
    };
  }, null);
}

/**
 * Full transaction detail for the printable receipt. Scoped to the current user
 * so a forged id can't leak another customer's order. Returns null when the
 * order is missing or not owned by the caller.
 */
export async function getOrderReceipt(id: string): Promise<OrderReceiptVM | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return safeQuery(`getOrderReceipt:${id}`, async () => {
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: {
        items: true,
        user: { select: { firstName: true, lastName: true, phoneNumber: true } },
      },
    });
    if (!order) return null;

    return {
      id: order.id,
      createdDate: order.createdAt.toLocaleString('fa-IR'),
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      customerName: `${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim(),
      phoneNumber: order.user.phoneNumber,
      address: {
        province: order.snapshotProvince,
        city: order.snapshotCity,
        street: order.snapshotStreet,
        postalCode: order.snapshotPostalCode,
      },
      items: order.items.map((i) => {
        const unitPrice = Number(i.priceAtPurchase);
        return {
          name: i.productName,
          sku: i.productSku,
          quantity: i.quantity,
          unitPrice,
          lineTotal: unitPrice * i.quantity,
        };
      }),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      totalAmount: Number(order.totalAmount),
    };
  }, null);
}

/**
 * Validate the contact + delivery fields submitted from the checkout form.
 * Mirrors the client-side rules and the signup validation so the server stays
 * authoritative. Returns a trimmed, normalized copy on success.
 */
function validateContact(
  contact: CheckoutContact,
): { ok: true; value: CheckoutContact } | { ok: false; error: string } {
  const value: CheckoutContact = {
    firstName: contact.firstName.trim(),
    lastName: contact.lastName.trim(),
    province: contact.province.trim(),
    city: contact.city.trim(),
    street: contact.street.trim(),
    postalCode: contact.postalCode.trim(),
  };
  if (!value.firstName) return { ok: false, error: 'نام الزامی است.' };
  if (!value.lastName) return { ok: false, error: 'نام خانوادگی الزامی است.' };
  if (!value.province) return { ok: false, error: 'استان الزامی است.' };
  if (!value.city) return { ok: false, error: 'شهر الزامی است.' };
  if (!value.street) return { ok: false, error: 'آدرس الزامی است.' };
  if (!/^\d{10}$/.test(value.postalCode)) {
    return { ok: false, error: 'کد پستی باید دقیقاً ۱۰ رقم باشد.' };
  }
  return { ok: true, value };
}

/**
 * Place an order from the checkout page.
 *
 * One transaction that: (1) saves the buyer's contact + delivery details to
 * their profile / default address — so an empty profile is filled in and edits
 * are persisted — then (2) snapshots that address, freezes per-line prices,
 * decrements stock, creates the order and clears the cart.
 */
export async function submitCheckout(
  input: CheckoutInput,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('submitCheckout', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای ثبت سفارش وارد شوید.');

    const validated = validateContact(input.contact);
    if (!validated.ok) return fail(validated.error);
    const contact = validated.value;

    const [cart, shipping] = await Promise.all([
      prisma.cart.findUnique({
        where: { userId: user.id },
        include: { items: { include: { product: true } } },
      }),
      prisma.shippingOption.findUnique({ where: { id: input.shippingOptionId } }),
    ]);

    if (!cart || cart.items.length === 0) return fail('سبد خرید شما خالی است.');
    if (!shipping || !shipping.isActive) return fail('روش ارسال معتبر نیست.');

    // Validate stock up front.
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return fail(`موجودی «${item.product.name}» کافی نیست.`);
      }
    }

    // Resolve the province (seeded reference data) and find-or-create the city.
    const province = await prisma.province.findUnique({
      where: { name: contact.province },
    });
    if (!province) return fail('استان انتخاب‌شده معتبر نیست.');
    const city = await prisma.city.upsert({
      where: { provinceId_name: { provinceId: province.id, name: contact.city } },
      create: { provinceId: province.id, name: contact.city },
      update: {},
      select: { id: true },
    });

    const isWholesale = user.role === 'WHOLESALE';
    const lineItems = cart.items.map((item) => {
      const base = item.product.basePrice;
      const discountPct = Number(item.product.wholesaleDiscountPct);
      const unit =
        isWholesale && discountPct > 0
          ? (base * BigInt(Math.round((100 - discountPct) * 100))) / BigInt(10000)
          : base;
      return {
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        priceAtPurchase: unit,
        quantity: item.quantity,
      };
    });

    const subtotal = lineItems.reduce(
      (sum, l) => sum + l.priceAtPurchase * BigInt(l.quantity),
      BigInt(0),
    );
    const shippingCost = shipping.cost;
    const taxAmount =
      TAX_RATE > 0
        ? (subtotal * BigInt(Math.round(TAX_RATE * 10000))) / BigInt(10000)
        : BigInt(0);
    const totalAmount = subtotal + shippingCost + taxAmount;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Persist the buyer's profile + delivery address (fill-or-update).
      await tx.user.update({
        where: { id: user.id },
        data: { firstName: contact.firstName, lastName: contact.lastName },
      });

      const existingAddress = await tx.address.findFirst({
        where: { userId: user.id },
        orderBy: { isDefault: 'desc' },
        select: { id: true },
      });
      const addressData: Prisma.AddressUncheckedCreateInput = {
        userId: user.id,
        cityId: city.id,
        street: contact.street,
        postalCode: contact.postalCode,
        isDefault: true,
      };
      const address = existingAddress
        ? await tx.address.update({
            where: { id: existingAddress.id },
            data: { cityId: city.id, street: contact.street, postalCode: contact.postalCode },
          })
        : await tx.address.create({ data: addressData });

      // 2. Create the order with a snapshot of the (just-saved) address.
      const created = await tx.order.create({
        data: {
          userId: user.id,
          addressId: address.id,
          shippingOptionId: shipping.id,
          paymentMethod: input.paymentMethod,
          snapshotProvince: province.name,
          snapshotCity: contact.city,
          snapshotStreet: contact.street,
          snapshotPostalCode: contact.postalCode,
          subtotal,
          shippingCost,
          taxAmount,
          totalAmount,
          notes: input.notes ?? null,
          items: { create: lineItems },
        },
        select: { id: true },
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

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    // Stock changed → catalogue caches are now stale. The cart, checkout and
    // dashboard all re-read on next visit.
    updateTag(tags.products);
    revalidatePath('/cart');
    revalidatePath('/checkout');
    revalidatePath('/dashboard');

    return ok(order);
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  return runMutation('updateOrderStatus', async () => {
    const now = new Date();
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'PAID' ? { paidAt: now } : {}),
        ...(status === 'SHIPPED' ? { shippedAt: now } : {}),
        ...(status === 'COMPLETED' ? { deliveredAt: now } : {}),
      },
    });
    revalidatePath('/dashboard');
    return ok(undefined);
  });
}
