/**
 * Navigation & shipping reference Server Actions.
 * Nav links / shipping options are admin-managed reference data → `days`.
 */

import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import {
  toNavLinkVM,
  toShippingOptionVM,
  type NavLinkVM,
  type ShippingOptionVM,
} from '@/src/lib/serializers';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export async function getNavLinks(): Promise<NavLinkVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.navLinks);

  return safeQuery('getNavLinks', async () => {
    const rows = await prisma.navLink.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toNavLinkVM);
  }, []);
}

export async function getShippingOptions(): Promise<ShippingOptionVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.shipping);

  return safeQuery('getShippingOptions', async () => {
    const rows = await prisma.shippingOption.findMany({
      where: { isActive: true },
      orderBy: { cost: 'asc' },
    });
    return rows.map(toShippingOptionVM);
  }, []);
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createNavLink(input: {
  href: string;
  label: string;
  sortOrder?: number;
}): Promise<ActionResult<{ id: number }>> {
  'use server';
  return runMutation('createNavLink', async () => {
    if (!input.href?.trim() || !input.label?.trim()) {
      return fail('آدرس و عنوان لینک الزامی است.');
    }
    const created = await prisma.navLink.create({
      data: {
        href: input.href.trim(),
        label: input.label.trim(),
        sortOrder: input.sortOrder ?? 0,
      },
      select: { id: true },
    });
    updateTag(tags.navLinks);
    return ok(created);
  });
}

export async function deleteNavLink(id: number): Promise<ActionResult> {
  'use server';
  return runMutation('deleteNavLink', async () => {
    await prisma.navLink.delete({ where: { id } });
    updateTag(tags.navLinks);
    return ok(undefined);
  });
}
