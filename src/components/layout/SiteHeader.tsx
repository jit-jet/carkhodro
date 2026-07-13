/**
 * Server header shell — cached nav links + session-aware account slots.
 * Account menus are passed as `children` / slots so React Suspense boundaries
 * sit directly in the server tree (required by Cache Components).
 */

import { Suspense } from 'react';
import { getNavLinks } from '@/actions/navigation';
import Header from '@/src/components/layout/Header';
import AccountMenu, {
  AccountMenuFallback,
  MobileAccountSection,
} from '@/src/components/layout/AccountMenu';

export default async function SiteHeader() {
  const navLinks = await getNavLinks();

  return (
    <Header
      navLinks={navLinks}
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
