'use server';

/**
 * Thin shop-phone read for client CTAs (call-for-price).
 * Kept as a pure `'use server'` module (no `use cache`) so Client Components
 * can import it without pulling cached site-settings into the browser bundle.
 *
 * Returns the primary phone for the current viewer role
 * (retail/guest → retail phones; wholesale → wholesale phones).
 */

import { prisma } from '@/src/lib/prisma';
import { getCurrentUser } from '@/src/lib/session';
import { primaryContactPhone } from '@/src/lib/site-settings-display';
import { pricingRoleFromUser } from '@/src/lib/user-role';

export async function getShopContactPhone(): Promise<string> {
  try {
    const [row, user] = await Promise.all([
      prisma.siteSetting.findUnique({
        where: { id: 1 },
        select: {
          retailPhone1: true,
          retailPhone2: true,
          wholesalePhone1: true,
          wholesalePhone2: true,
          wholesalePhone3: true,
          wholesalePhone4: true,
        },
      }),
      getCurrentUser(),
    ]);
    return primaryContactPhone(
      {
        retailPhone1: row?.retailPhone1 ?? '',
        retailPhone2: row?.retailPhone2 ?? '',
        wholesalePhone1: row?.wholesalePhone1 ?? '',
        wholesalePhone2: row?.wholesalePhone2 ?? '',
        wholesalePhone3: row?.wholesalePhone3 ?? '',
        wholesalePhone4: row?.wholesalePhone4 ?? '',
      },
      pricingRoleFromUser(user?.role),
    );
  } catch (err) {
    console.error('[shop-phone:getShopContactPhone]', err);
    return '';
  }
}
