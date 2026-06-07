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
import type { OrderStatus } from '@/generated/prisma_client';
import type { OrderSummaryVM, CheckoutInput } from '@/src/lib/serializers';

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

export async function createOrder(
  input: CheckoutInput,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('createOrder', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای ثبت سفارش وارد شوید.');

    const [cart, address, shipping] = await Promise.all([
      prisma.cart.findUnique({
        where: { userId: user.id },
        include: { items: { include: { product: true } } },
      }),
      prisma.address.findFirst({
        where: { userId: user.id, ...(input.addressId ? { id: input.addressId } : {}) },
        include: { city: { include: { province: true } } },
        orderBy: { isDefault: 'desc' },
      }),
      prisma.shippingOption.findUnique({ where: { id: input.shippingOptionId } }),
    ]);

    if (!cart || cart.items.length === 0) return fail('سبد خرید شما خالی است.');
    if (!address) return fail('آدرسی برای ارسال ثبت نشده است. ابتدا یک آدرس اضافه کنید.');
    if (!shipping || !shipping.isActive) return fail('روش ارسال معتبر نیست.');

    // Validate stock up front.
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return fail(`موجودی «${item.product.name}» کافی نیست.`);
      }
    }

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
    const taxAmount = BigInt(0);
    const totalAmount = subtotal + shippingCost + taxAmount;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: user.id,
          addressId: address.id,
          shippingOptionId: shipping.id,
          paymentMethod: input.paymentMethod,
          snapshotProvince: address.city.province.name,
          snapshotCity: address.city.name,
          snapshotStreet: address.street,
          snapshotPostalCode: address.postalCode,
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

    // Stock changed → catalogue caches are now stale.
    updateTag(tags.products);
    revalidatePath('/cart');

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
        ...(status === 'SHIPPED' ? { shippedAt: now } : {}),
        ...(status === 'DELIVERED' ? { deliveredAt: now } : {}),
      },
    });
    revalidatePath('/dashboard');
    return ok(undefined);
  });
}
