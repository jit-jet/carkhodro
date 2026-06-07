/**
 * Brand & car-taxonomy Server Actions (car brands, car models, parts brands).
 * Reference data → `days` cache profile.
 */

import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import {
  toCarBrandVM,
  toCarModelVM,
  type CarBrandVM,
  type CarModelVM,
} from '@/src/lib/serializers';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

// ── Car brands (manufacturers) ───────────────────────────────────────────────

export async function getCarBrands(): Promise<CarBrandVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.carBrands);

  return safeQuery('getCarBrands', async () => {
    const rows = await prisma.carBrand.findMany({ orderBy: { productCount: 'desc' } });
    return rows.map(toCarBrandVM);
  }, []);
}

// ── Car models ───────────────────────────────────────────────────────────────

export async function getCarModels(): Promise<CarModelVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.carModels, tags.carBrands);

  return safeQuery('getCarModels', async () => {
    const rows = await prisma.carModel.findMany({
      include: { carBrand: true },
      orderBy: { id: 'asc' },
    });
    return rows.map(toCarModelVM);
  }, []);
}

// ── Parts brands (suppliers) ─────────────────────────────────────────────────

export async function getPartsBrands(): Promise<{ id: number; name: string }[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.partsBrands);

  return safeQuery('getPartsBrands', async () => {
    const rows = await prisma.partsBrand.findMany({ orderBy: { name: 'asc' } });
    return rows.map((b) => ({ id: b.id, name: b.name }));
  }, []);
}

// ── Mutations (baseline) ─────────────────────────────────────────────────────

export async function createCarBrand(input: {
  name: string;
  slug: string;
  logoImage?: string | null;
}): Promise<ActionResult<{ id: number }>> {
  'use server';
  return runMutation('createCarBrand', async () => {
    if (!input.name?.trim() || !input.slug?.trim()) {
      return fail('نام و اسلاگ برند الزامی است.');
    }
    const created = await prisma.carBrand.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        logoImage: input.logoImage ?? null,
      },
      select: { id: true },
    });
    updateTag(tags.carBrands);
    return ok(created);
  });
}

export async function createCarModel(input: {
  carBrandId: number;
  name: string;
  yearStart?: number | null;
  yearEnd?: number | null;
  image?: string | null;
}): Promise<ActionResult<{ id: number }>> {
  'use server';
  return runMutation('createCarModel', async () => {
    if (!input.name?.trim()) return fail('نام مدل الزامی است.');
    const created = await prisma.carModel.create({
      data: {
        carBrandId: input.carBrandId,
        name: input.name.trim(),
        yearStart: input.yearStart ?? null,
        yearEnd: input.yearEnd ?? null,
        image: input.image ?? null,
      },
      select: { id: true },
    });
    updateTag(tags.carModels);
    return ok(created);
  });
}

export async function createPartsBrand(
  name: string,
): Promise<ActionResult<{ id: number }>> {
  'use server';
  return runMutation('createPartsBrand', async () => {
    if (!name?.trim()) return fail('نام برند الزامی است.');
    const created = await prisma.partsBrand.create({
      data: { name: name.trim() },
      select: { id: true },
    });
    updateTag(tags.partsBrands);
    return ok(created);
  });
}
