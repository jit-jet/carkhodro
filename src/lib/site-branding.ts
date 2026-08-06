import type { Metadata } from 'next';
import type { PublicSiteSettingsVM } from '@/src/lib/serializers';

export const SITE_SETTING_DEFAULTS = {
  siteName: 'کارخودرو',
  logoUrl: '/logo.png',
  metaTitle: 'کارخودرو | فروشگاه قطعات یدکی خودرو',
  metaDescription:
    'خرید آنلاین قطعات یدکی خودروهای ایرانی و خارجی با بهترین قیمت و ضمانت اصالت کالا',
  copyrightText: '© ۱۴۰۳ کارخودرو — تمامی حقوق محفوظ است.',
} as const;

export function resolvedSiteName(settings: Pick<PublicSiteSettingsVM, 'siteName'>): string {
  return settings.siteName.trim() || SITE_SETTING_DEFAULTS.siteName;
}

export function resolvedLogoUrl(settings: Pick<PublicSiteSettingsVM, 'logoUrl'>): string {
  return settings.logoUrl.trim() || SITE_SETTING_DEFAULTS.logoUrl;
}

export function resolvedCopyrightText(
  settings: Pick<PublicSiteSettingsVM, 'copyrightText'>,
): string {
  return settings.copyrightText.trim() || SITE_SETTING_DEFAULTS.copyrightText;
}

/** Build root Metadata from admin-managed site settings (with hardcoded fallbacks). */
export function buildRootMetadata(settings: PublicSiteSettingsVM): Metadata {
  const siteName = resolvedSiteName(settings);
  const title = settings.metaTitle.trim() || SITE_SETTING_DEFAULTS.metaTitle;
  const description =
    settings.metaDescription.trim() || SITE_SETTING_DEFAULTS.metaDescription;
  const favicon = settings.faviconUrl.trim();
  const apple = settings.appleTouchIconUrl.trim();
  const ogImage = settings.ogImageUrl.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

  const metadata: Metadata = {
    title,
    description,
    applicationName: siteName,
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName,
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };

  if (appUrl) {
    metadata.metadataBase = new URL(appUrl);
  }

  if (favicon || apple) {
    metadata.icons = {
      ...(favicon ? { icon: favicon } : {}),
      ...(apple ? { apple } : {}),
    };
  }

  return metadata;
}
