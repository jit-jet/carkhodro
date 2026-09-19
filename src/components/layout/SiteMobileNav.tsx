import { getMobileNavItems } from '@/actions/mobile-nav';
import MobileNav from '@/src/components/layout/MobileNav';

export default async function SiteMobileNav() {
  const items = await getMobileNavItems();
  return <MobileNav items={items} />;
}
