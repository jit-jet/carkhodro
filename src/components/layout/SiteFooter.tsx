/**
 * Server footer shell — cached site settings + social links.
 */

import { getPublicSiteSettings, getSocialLinks } from '@/actions/site-settings';
import Footer from '@/src/components/layout/Footer';

export default async function SiteFooter() {
  const [settings, socialLinks] = await Promise.all([
    getPublicSiteSettings(),
    getSocialLinks(),
  ]);

  return <Footer settings={settings} socialLinks={socialLinks} />;
}
