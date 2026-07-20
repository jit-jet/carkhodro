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
import { toPublicSiteSettingsVM, type PublicSiteSettingsVM } from '@/src/lib/serializers';
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

    const data = {
      phone: input.phone?.trim() || null,
      secondaryPhone: input.secondaryPhone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      workingHours: input.workingHours?.trim() || null,
      headerPromo1: input.headerPromo1?.trim() || null,
      headerPromo2: input.headerPromo2?.trim() || null,
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
