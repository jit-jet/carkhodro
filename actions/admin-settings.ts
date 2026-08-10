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
import { deleteFile } from '@/src/lib/storage';

export type SiteSettingVM = PublicSiteSettingsVM;

const EMPTY_SETTINGS: SiteSettingVM = toPublicSiteSettingsVM(null);

const ASSET_KEYS = [
  'headerPromo1Icon',
  'headerPromo2Icon',
  'logoUrl',
  'productWatermarkUrl',
  'faviconUrl',
  'appleTouchIconUrl',
  'ogImageUrl',
] as const;

function trimOrNull(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value.trim() || null;
}

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

    if (input.analyticsId !== undefined) {
      const id = input.analyticsId.trim();
      if (
        id &&
        !/^GTM-[A-Z0-9]+$/i.test(id) &&
        !/^(G|UA|AW|GT)-[A-Z0-9-]+$/i.test(id)
      ) {
        return fail(
          'شناسه آنالیتیکس معتبر نیست. مقدار باید با GTM-، G-، UA-، AW- یا GT- شروع شود.',
        );
      }
    }
    if (input.googleAnalyticsId !== undefined) {
      const id = input.googleAnalyticsId.trim();
      if (id && !/^(G|UA|AW|GT)-[A-Z0-9-]+$/i.test(id)) {
        return fail('شناسه Google Analytics معتبر نیست.');
      }
    }
    if (input.googleTagManagerId !== undefined) {
      const id = input.googleTagManagerId.trim();
      if (id && !/^GTM-[A-Z0-9]+$/i.test(id)) {
        return fail('شناسه Google Tag Manager معتبر نیست.');
      }
    }

    const data: Record<string, string | boolean | null> = {};

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
    if (input.headerPromo1Icon !== undefined) {
      data.headerPromo1Icon = input.headerPromo1Icon.trim() || null;
    }
    if (input.headerPromo2Icon !== undefined) {
      data.headerPromo2Icon = input.headerPromo2Icon.trim() || null;
    }
    if (input.aboutText !== undefined) {
      data.aboutText = input.aboutText.trim() || null;
    }
    if (input.footerTrustBadges !== undefined) {
      Object.assign(data, footerTrustBadgesToDbFields(input.footerTrustBadges));
    }

    const branding = {
      siteName: trimOrNull(input.siteName),
      logoUrl: trimOrNull(input.logoUrl),
      productWatermarkUrl: trimOrNull(input.productWatermarkUrl),
      faviconUrl: trimOrNull(input.faviconUrl),
      appleTouchIconUrl: trimOrNull(input.appleTouchIconUrl),
      metaTitle: trimOrNull(input.metaTitle),
      metaDescription: trimOrNull(input.metaDescription),
      ogImageUrl: trimOrNull(input.ogImageUrl),
      copyrightText: trimOrNull(input.copyrightText),
      analyticsId: trimOrNull(input.analyticsId),
      googleAnalyticsId: trimOrNull(input.googleAnalyticsId),
      googleTagManagerId: trimOrNull(input.googleTagManagerId),
      searchConsoleVerification: trimOrNull(input.searchConsoleVerification),
    };
    if (input.productWatermarkPosition !== undefined) {
      const allowed = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
      if (!allowed.includes(input.productWatermarkPosition)) return fail('محل نمایش لوگو معتبر نیست.');
      data.productWatermarkPosition = input.productWatermarkPosition;
    }
    for (const [key, value] of Object.entries(branding)) {
      if (value !== undefined) data[key] = value;
    }
    if (input.robotsIndex !== undefined) data.robotsIndex = input.robotsIndex;
    if (input.robotsFollow !== undefined) data.robotsFollow = input.robotsFollow;

    const previous = await prisma.siteSetting.findUnique({
      where: { id: 1 },
      select: {
        headerPromo1Icon: true,
        headerPromo2Icon: true,
        logoUrl: true,
        productWatermarkUrl: true,
        faviconUrl: true,
        appleTouchIconUrl: true,
        ogImageUrl: true,
      },
    });

    await prisma.siteSetting.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });

    for (const key of ASSET_KEYS) {
      if (input[key] === undefined || !previous?.[key]) continue;
      const nextValue = data[key];
      if (previous[key] !== nextValue) {
        await deleteFile(previous[key] as string);
      }
    }

    updateTag(tags.siteSettings);
    return ok(undefined);
  });
}
