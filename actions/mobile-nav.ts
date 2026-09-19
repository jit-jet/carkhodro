import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export type MobileNavItemVM = {
  id: number;
  href: string;
  label: string;
  iconUrl: string;
  order: number;
  isActive: boolean;
};

export async function getMobileNavItems(): Promise<MobileNavItemVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.mobileNav);
  return safeQuery('getMobileNavItems', async () => {
    const rows = await prisma.mobileNavItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      href: row.href,
      label: row.label,
      iconUrl: row.iconUrl,
      order: row.sortOrder,
      isActive: row.isActive,
    }));
  }, []);
}
