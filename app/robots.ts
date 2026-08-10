import type { MetadataRoute } from 'next';
import { getPublicSiteSettings } from '@/actions/site-settings';
import { siteUrl } from '@/src/lib/seo';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicSiteSettings();
  return {
    rules: settings.robotsIndex
      ? { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/dashboard/', '/checkout/'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: siteUrl('/sitemap.xml'),
    host: siteUrl('/'),
  };
}
