'use server';

/**
 * Pre-order / backorder Server Actions («پیش‌خرید»).
 * ───────────────────────────────────────────────────
 * Requests a partner places against an out-of-stock part so they're notified
 * when it returns. Read + cancel here; the dashboard home shows the open count
 * and `/dashboard/backorders` lists them. Per-user / dynamic — never cached.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { formatJalaliDate } from '@/src/lib/format';
import type { BackorderStatus } from '@/generated/prisma_client';
import type { BackorderVM } from '@/src/lib/dashboard-types';

const BACKORDER_STATUS_FA: Record<BackorderStatus, string> = {
  PENDING: 'در انتظار موجودی',
  NOTIFIED: 'موجود شد',
  FULFILLED: 'تبدیل به سفارش',
  CANCELLED: 'لغو شده',
};

export async function getBackorders(): Promise<BackorderVM[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  return safeQuery(
    'getBackorders',
    async () => {
      const rows = await prisma.backorder.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, sku: true, stock: true } } },
      });
      return rows.map((b) => ({
        id: b.id,
        productId: b.productId,
        productName: b.product.name,
        sku: b.product.sku,
        quantity: b.quantity,
        status: b.status,
        statusLabel: BACKORDER_STATUS_FA[b.status],
        inStock: b.product.stock > 0,
        date: formatJalaliDate(b.createdAt),
      }));
    },
    [],
  );
}

/** Place a backorder for an out-of-stock product. Idempotent per (user, product). */
export async function createBackorder(
  productId: string,
  quantity = 1,
): Promise<ActionResult> {
  return runMutation('createBackorder', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای ثبت پیش‌خرید وارد شوید.');

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!product) return fail('محصول یافت نشد.');

    const existing = await prisma.backorder.findFirst({
      where: { userId: user.id, productId, status: 'PENDING' },
      select: { id: true },
    });
    const qty = Math.max(1, Math.round(quantity));
    if (existing) {
      await prisma.backorder.update({ where: { id: existing.id }, data: { quantity: qty } });
    } else {
      await prisma.backorder.create({ data: { userId: user.id, productId, quantity: qty } });
    }

    revalidatePath('/dashboard/backorders');
    revalidatePath('/dashboard');
    return ok(undefined);
  });
}

export async function cancelBackorder(id: string): Promise<ActionResult> {
  return runMutation('cancelBackorder', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');
    await prisma.backorder.updateMany({
      where: { id, userId: user.id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    revalidatePath('/dashboard/backorders');
    revalidatePath('/dashboard');
    return ok(undefined);
  });
}
