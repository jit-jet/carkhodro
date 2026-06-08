'use server';

/**
 * Profile / account Server Actions.
 * ─────────────────────────────────
 * Read path used to pre-fill the checkout form with whatever the signed-in user
 * has already saved (name + default delivery address). Per-user / dynamic — it
 * reads the session cookie and is never cached.
 *
 * The cart is intentionally NOT touched here: profile (contact + address) and
 * cart data live in separate tables and are loaded through separate paths
 * (`src/lib/cart-data`). This module only deals with the `User` / `Address`
 * side of that boundary.
 */

import { prisma } from '@/src/lib/prisma';
import { getCurrentUser } from '@/src/lib/session';
import { safeQuery } from '@/src/lib/result';
import type { CheckoutProfileVM } from '@/src/lib/serializers';

/**
 * The current user's checkout pre-fill, or `null` for guests. Returns the saved
 * default (or most-recent) address flattened into plain strings; missing fields
 * come back as empty strings so the form can force the user to complete them.
 */
export async function getCheckoutProfile(): Promise<CheckoutProfileVM | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return safeQuery(
    'getCheckoutProfile',
    async () => {
      const address = await prisma.address.findFirst({
        where: { userId: user.id },
        include: { city: { include: { province: true } } },
        orderBy: { isDefault: 'desc' },
      });

      const contact = {
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        province: address?.city.province.name ?? '',
        city: address?.city.name ?? '',
        street: address?.street ?? '',
        postalCode: address?.postalCode ?? '',
      };

      const isComplete = Boolean(
        contact.firstName &&
          contact.lastName &&
          contact.province &&
          contact.city &&
          contact.street &&
          /^\d{10}$/.test(contact.postalCode),
      );

      return {
        ...contact,
        phoneNumber: user.phoneNumber,
        hasSavedAddress: Boolean(address),
        isComplete,
      } satisfies CheckoutProfileVM;
    },
    // Fallback (DB hiccup): an empty, incomplete profile keyed to this account.
    {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      province: '',
      city: '',
      street: '',
      postalCode: '',
      phoneNumber: user.phoneNumber,
      hasSavedAddress: false,
      isComplete: false,
    },
  );
}
