'use server';

/**
 * Site settings Server Actions — dynamic contact/social info shown on the
 * storefront (footer, contact page, etc). Always a single row (`id = 1`),
 * upserted from the admin panel.
 *
 * Whole file is `use server` (not `use cache`) — it's imported directly by
 * `SettingsForm`, a Client Component, and a file imported by a Client
 * Component can't mix in per-function `use cache` reads (see the note atop
 * `actions/products.ts`). Storefront reads use `actions/site-settings.ts`.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import {
  footerTrustBadgesToDbFields,
  toPublicSiteSettingsVM,
  type PublicSiteSettingsVM,
} from '@/src/lib/serializers';
import { tags } from '@/actions/cache-tags';

export type SiteSettingVM = PublicSiteSettingsVM;

const EMPTY_SETTINGS: SiteSettingVM = toPublicSiteSettingsVM(null);

export async function getSiteSettings(): Promise<SiteSettingVM> {
  return safeQuery(
    'getSiteSettings',
    async () => {
      const row = await prisma.siteSetting.findUnique({ where: { id: 1 } });
      return toPublicSiteSettingsVM(row);
    },
    EMPTY_SETTINGS,
  );
}

export async function updateSiteSettings(
  input: Partial<SiteSettingVM>,
): Promise<ActionResult> {
  return runMutation('updateSiteSettings', async () => {
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      return fail('ایمیل معتبر نیست.');
    }

    const data: Record<string, string | null> = {};

    if (input.retailPhone1 !== undefined) {
      data.retailPhone1 = input.retailPhone1.trim() || null;
    }
    if (input.retailPhone2 !== undefined) {
      data.retailPhone2 = input.retailPhone2.trim() || null;
    }
    if (input.wholesalePhone1 !== undefined) {
      data.wholesalePhone1 = input.wholesalePhone1.trim() || null;
    }
    if (input.wholesalePhone2 !== undefined) {
      data.wholesalePhone2 = input.wholesalePhone2.trim() || null;
    }
    if (input.wholesalePhone3 !== undefined) {
      data.wholesalePhone3 = input.wholesalePhone3.trim() || null;
    }
    if (input.wholesalePhone4 !== undefined) {
      data.wholesalePhone4 = input.wholesalePhone4.trim() || null;
    }
    if (input.email !== undefined) data.email = input.email.trim() || null;
    if (input.address !== undefined) data.address = input.address.trim() || null;
    if (input.workingHours !== undefined) {
      data.workingHours = input.workingHours.trim() || null;
    }
    if (input.headerPromo1 !== undefined) {
      data.headerPromo1 = input.headerPromo1.trim() || null;
    }
    if (input.headerPromo2 !== undefined) {
      data.headerPromo2 = input.headerPromo2.trim() || null;
    }
    if (input.aboutText !== undefined) {
      data.aboutText = input.aboutText.trim() || null;
    }
    if (input.footerTrustBadges !== undefined) {
      Object.assign(data, footerTrustBadgesToDbFields(input.footerTrustBadges));
    }

    await prisma.siteSetting.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    updateTag(tags.siteSettings);
    return ok(undefined);
  });
}
