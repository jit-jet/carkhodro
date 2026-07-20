/**
 * Server header shell — cached nav links + session-aware account slots.
 * Account menus are passed as `children` / slots so React Suspense boundaries
 * sit directly in the server tree (required by Cache Components).
 */

import { Suspense } from 'react';
import { getNavLinks } from '@/actions/navigation';
import { getPublicSiteSettings } from '@/actions/site-settings';
import Header from '@/src/components/layout/Header';
import AccountMenu, {
  AccountMenuFallback,
  MobileAccountSection,
} from '@/src/components/layout/AccountMenu';
import { getCurrentUser } from '@/src/lib/session';
import { cartPathForRole, pricingRoleFromUser ,isWholesaleUser} from '@/src/lib/user-role';

export default async function SiteHeader() {
  const [navLinks, user, settings] = await Promise.all([
    getNavLinks(),
    getCurrentUser(),
    getPublicSiteSettings(),
  ]);
  const cartHref = cartPathForRole(pricingRoleFromUser(user?.role));
  if(isWholesaleUser(pricingRoleFromUser(user?.role))){
    navLinks.push({
      id: 100,
      href: '/dashboard/suggest-product',
      label: 'درخواست تأمین کالا',
      order: 100,
    });
  }
  return (
    <Header
      navLinks={navLinks}
      cartHref={cartHref}
      contactInfo={settings}
      mobileMenuAccount={
        <Suspense fallback={null}>
          <MobileAccountSection />
        </Suspense>
      }
    >
      <Suspense fallback={<AccountMenuFallback />}>
        <AccountMenu />
      </Suspense>
    </Header>
  );
}
