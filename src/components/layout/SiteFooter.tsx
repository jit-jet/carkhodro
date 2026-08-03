/**
 * Server footer shell — cached site settings, social links, and footer menus.
 */

import { getPublicSiteSettings, getSocialLinks } from '@/actions/site-settings';
import { getFooterLinks } from '@/actions/footer-links';
import Footer from '@/src/components/layout/Footer';

export default async function SiteFooter() {
  const [settings, socialLinks, footerLinks] = await Promise.all([
    getPublicSiteSettings(),
    getSocialLinks(),
    getFooterLinks(),
  ]);

  const quickLinks = footerLinks.filter((link) => link.group === 'QUICK');
  const categoryLinks = footerLinks.filter((link) => link.group === 'CATEGORY');

  return (
    <Footer
      settings={settings}
      socialLinks={socialLinks}
      quickLinks={quickLinks}
      categoryLinks={categoryLinks}
    />
  );
}
