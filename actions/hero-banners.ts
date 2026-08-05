'use server';

/**
 * Public + admin reads for homepage hero (static copy + image slides).
 * Mutations live in `actions/admin-hero-banners.ts`.
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { safeQuery } from '@/src/lib/result';
import {
  toAdminHeroBannerVM,
  toHeroBannerVM,
  toHeroContentVM,
  type AdminHeroBannerVM,
  type HeroBannerVM,
  type HeroContentVM,
} from '@/src/lib/serializers';
import { tags } from '@/actions/cache-tags';

const EMPTY_CONTENT: HeroContentVM = toHeroContentVM(null);

export async function getHeroContent(): Promise<HeroContentVM> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.heroBanners);

  return safeQuery(
    'getHeroContent',
    async () => {
      const row = await prisma.siteSetting.findUnique({ where: { id: 1 } });
      return toHeroContentVM(row);
    },
    EMPTY_CONTENT,
  );
}

export async function getHeroBanners(): Promise<HeroBannerVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.heroBanners);

  return safeQuery(
    'getHeroBanners',
    async () => {
      const rows = await prisma.heroBanner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      return rows.map(toHeroBannerVM);
    },
    [],
  );
}

export async function getAllHeroBanners(): Promise<AdminHeroBannerVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.heroBanners);

  return safeQuery(
    'getAllHeroBanners',
    async () => {
      const rows = await prisma.heroBanner.findMany({
        orderBy: { sortOrder: 'asc' },
      });
      return rows.map(toAdminHeroBannerVM);
    },
    [],
  );
}
