'use server';

/**
 * Thin shop-phone read for client CTAs (call-for-price).
 * Kept as a pure `'use server'` module (no `use cache`) so Client Components
 * can import it without pulling cached site-settings into the browser bundle.
 */

import { prisma } from '@/src/lib/prisma';

export async function getShopContactPhone(): Promise<string> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { id: 1 },
      select: { phone: true, secondaryPhone: true },
    });
    return row?.phone?.trim() || row?.secondaryPhone?.trim() || '';
  } catch (err) {
    console.error('[shop-phone:getShopContactPhone]', err);
    return '';
  }
}
