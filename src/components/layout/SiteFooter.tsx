/**
 * Server footer shell — cached site settings, social links, and footer menus.
 * Contact phones are filtered by the current viewer role.
 */

import { getPublicSiteSettings, getSocialLinks } from '@/actions/site-settings';
import { getFooterLinks } from '@/actions/footer-links';
import Footer from '@/src/components/layout/Footer';
import { getCurrentUser } from '@/src/lib/session';
import { pricingRoleFromUser } from '@/src/lib/user-role';

export default async function SiteFooter() {
  const [settings, socialLinks, footerLinks, user] = await Promise.all([
    getPublicSiteSettings(),
    getSocialLinks(),
    getFooterLinks(),
    getCurrentUser(),
  ]);

  const quickLinks = footerLinks.filter((link) => link.group === 'QUICK');
  const categoryLinks = footerLinks.filter((link) => link.group === 'CATEGORY');

  return (
    <Footer
      settings={settings}
      socialLinks={socialLinks}
      quickLinks={quickLinks}
      categoryLinks={categoryLinks}
      viewerRole={pricingRoleFromUser(user?.role)}
    />
  );
}
