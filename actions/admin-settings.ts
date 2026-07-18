'use server';

/**
 * Site settings Server Actions — dynamic contact/social info shown on the
 * storefront (footer, contact page, etc). Always a single row (`id = 1`),
 * upserted from the admin panel.
 *
 * Whole file is `use server` (not `use cache`) — it's imported directly by
 * `SettingsForm`, a Client Component, and a file imported by a Client
 * Component can't mix in per-function `use cache` reads (see the note atop
 * `actions/products.ts`). Settings change rarely and this is an admin-only
 * page, so an uncached read is a fine trade — `updateTag` is still called on
 * write in case a future storefront consumer reads it through a cached
 * wrapper elsewhere.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export interface SiteSettingVM {
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  workingHours: string;
  instagramUrl: string;
  telegramUrl: string;
  whatsappUrl: string;
  aboutText: string;
}

const EMPTY_SETTINGS: SiteSettingVM = {
  phone: '',
  secondaryPhone: '',
  email: '',
  address: '',
  workingHours: '',
  instagramUrl: '',
  telegramUrl: '',
  whatsappUrl: '',
  aboutText: '',
};

export async function getSiteSettings(): Promise<SiteSettingVM> {
  return safeQuery(
    'getSiteSettings',
    async () => {
      const row = await prisma.siteSetting.findUnique({ where: { id: 1 } });
      if (!row) return EMPTY_SETTINGS;
      return {
        phone: row.phone ?? '',
        secondaryPhone: row.secondaryPhone ?? '',
        email: row.email ?? '',
        address: row.address ?? '',
        workingHours: row.workingHours ?? '',
        instagramUrl: row.instagramUrl ?? '',
        telegramUrl: row.telegramUrl ?? '',
        whatsappUrl: row.whatsappUrl ?? '',
        aboutText: row.aboutText ?? '',
      };
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

    const data = {
      phone: input.phone?.trim() || null,
      secondaryPhone: input.secondaryPhone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      workingHours: input.workingHours?.trim() || null,
      instagramUrl: input.instagramUrl?.trim() || null,
      telegramUrl: input.telegramUrl?.trim() || null,
      whatsappUrl: input.whatsappUrl?.trim() || null,
      aboutText: input.aboutText?.trim() || null,
    };

    await prisma.siteSetting.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    updateTag(tags.siteSettings);
    return ok(undefined);
  });
}
