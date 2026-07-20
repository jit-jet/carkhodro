/**
 * Navigation & shipping reference Server Actions — reads only.
 * Mutations live in `actions/admin-navigation.ts` (pure `use server`) so
 * `NavLinksManager` can import writes without pulling `use cache` into the bundle.
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import {
  toNavLinkVM,
  toAdminNavLinkVM,
  toShippingOptionVM,
  type NavLinkVM,
  type AdminNavLinkVM,
  type ShippingOptionVM,
} from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export async function getNavLinks(): Promise<NavLinkVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.navLinks);

  return safeQuery('getNavLinks', async () => {
    const rows = await prisma.navLink.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toNavLinkVM);
  }, []);
}

export async function getAllNavLinks(): Promise<AdminNavLinkVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.navLinks);

  return safeQuery('getAllNavLinks', async () => {
    const rows = await prisma.navLink.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toAdminNavLinkVM);
  }, []);
}

export async function getShippingOptions(): Promise<ShippingOptionVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.shipping);

  return safeQuery('getShippingOptions', async () => {
    const rows = await prisma.shippingOption.findMany({
      where: { isActive: true },
      orderBy: { cost: 'asc' },
    });
    return rows.map(toShippingOptionVM);
  }, []);
}
