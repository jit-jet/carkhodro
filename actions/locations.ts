/**
 * Province/city reference data Server Actions.
 * ─────────────────────────────────────────────
 * Seeded once from `src/assets/provinces_cities.json` (see `prisma/seed.ts`),
 * rarely changes — cached like the other reference lists (car brands, parts
 * brands, categories).
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { safeQuery } from '@/src/lib/result';
import type { ProvinceVM } from '@/src/lib/serializers';
import { tags } from '@/actions/cache-tags';

export async function getProvinces(): Promise<ProvinceVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.provinces);

  return safeQuery('getProvinces', async () => {
    const rows = await prisma.province.findMany({
      orderBy: { name: 'asc' },
      include: { cities: { orderBy: { name: 'asc' } } },
    });
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      cities: p.cities.map((c) => ({ id: c.id, name: c.name })),
    }));
  }, []);
}
