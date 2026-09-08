'use server';

import { prisma } from '@/src/lib/prisma';
import { normalizeIranMobile } from '@/src/lib/hesabfa/phone';
import { dispatchStockNotificationsForProducts } from '@/src/lib/stock-notification';
import { fail, ok, runMutation, type ActionResult } from '@/src/lib/result';

export async function subscribeToStockNotification(
  productId: string,
  rawPhoneNumber: string,
): Promise<ActionResult<{ subscribed: true }>> {
  return runMutation('subscribeToStockNotification', async () => {
    const phoneNumber = normalizeIranMobile(rawPhoneNumber);
    if (!phoneNumber) {
      return fail('شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).');
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true, stock: true },
    });
    if (!product) return fail('محصول یافت نشد.');
    if (product.stock > 0) {
      return fail('این کالا همین حالا موجود است؛ صفحه را تازه‌سازی کنید.');
    }

    await prisma.stockNotification.upsert({
      where: {
        productId_phoneNumber: { productId: product.id, phoneNumber },
      },
      create: { productId: product.id, phoneNumber },
      update: {
        requestedAt: new Date(),
        processingAt: null,
        sentAt: null,
        attemptCount: 0,
        lastError: null,
      },
    });

    // Close the small race where inventory becomes positive between the read
    // above and the subscription write.
    await dispatchStockNotificationsForProducts([product.id]);
    return ok({ subscribed: true });
  });
}
