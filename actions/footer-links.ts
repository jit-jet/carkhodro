/**
 * Footer link Server Actions — reads only.
 * Mutations live in `actions/admin-footer-links.ts` (pure `use server`) so
 * `FooterLinksManager` can import writes without pulling `use cache` into the bundle.
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import {
  toFooterLinkVM,
  toAdminFooterLinkVM,
  type FooterLinkVM,
  type AdminFooterLinkVM,
  type FooterLinkGroupVM,
} from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export async function getFooterLinks(
  group?: FooterLinkGroupVM,
): Promise<FooterLinkVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.footerLinks);

  return safeQuery('getFooterLinks', async () => {
    const rows = await prisma.footerLink.findMany({
      where: {
        isActive: true,
        ...(group ? { group } : {}),
      },
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
    });
    return rows.map(toFooterLinkVM);
  }, []);
}

export async function getAllFooterLinks(
  group?: FooterLinkGroupVM,
): Promise<AdminFooterLinkVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.footerLinks);

  return safeQuery('getAllFooterLinks', async () => {
    const rows = await prisma.footerLink.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
    });
    return rows.map(toAdminFooterLinkVM);
  }, []);
}
