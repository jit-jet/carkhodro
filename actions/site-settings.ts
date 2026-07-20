/**
 * Site settings read Server Actions — storefront consumption.
 * Mutations live in `actions/admin-settings.ts` and
 * `actions/admin-social-links.ts` so Client Components can import writes
 * without pulling `use cache` into the browser bundle.
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import {
  toPublicSiteSettingsVM,
  toSocialLinkVM,
  toAdminSocialLinkVM,
  type PublicSiteSettingsVM,
  type SocialLinkVM,
  type AdminSocialLinkVM,
} from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

const EMPTY_SETTINGS: PublicSiteSettingsVM = toPublicSiteSettingsVM(null);

export async function getPublicSiteSettings(): Promise<PublicSiteSettingsVM> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.siteSettings);

  return safeQuery('getPublicSiteSettings', async () => {
    const row = await prisma.siteSetting.findUnique({ where: { id: 1 } });
    return toPublicSiteSettingsVM(row);
  }, EMPTY_SETTINGS);
}

export async function getSocialLinks(): Promise<SocialLinkVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.socialLinks);

  return safeQuery('getSocialLinks', async () => {
    const rows = await prisma.socialLink.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toSocialLinkVM);
  }, []);
}

export async function getAllSocialLinks(): Promise<AdminSocialLinkVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.socialLinks);

  return safeQuery('getAllSocialLinks', async () => {
    const rows = await prisma.socialLink.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toAdminSocialLinkVM);
  }, []);
}
