/**
 * Brand & car-taxonomy Server Actions (car brands, car models, parts brands)
 * — reads only. Reference data → `days` cache profile.
 *
 * Mutations live in `actions/admin-brands.ts` (pure `use server`) so admin
 * Client Components can import them without dragging this file's `use cache`
 * reads into the browser bundle — see the note at the top of
 * `actions/products.ts` for the full explanation.
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import {
  toCarBrandVM,
  toCarModelVM,
  type CarBrandVM,
  type CarModelVM,
} from '@/src/lib/serializers';
import { safeQuery } from '@/src/lib/result';
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

export async function getPartsBrands(): Promise<{ id: number; name: string; slug: string }[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.partsBrands);

  return safeQuery('getPartsBrands', async () => {
    const rows = await prisma.partsBrand.findMany({ orderBy: { name: 'asc' } });
    return rows.map((b) => ({ id: b.id, name: b.name, slug: b.slug }));
  }, []);
}

/** Parts brands for the home slider — includes logo + active product counts. */
export async function getPartsBrandsHome(): Promise<
  { id: number; name: string; slug: string; image: string; count: number }[]
> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.partsBrands, tags.products);

  return safeQuery('getPartsBrandsHome', async () => {
    const rows = await prisma.partsBrand.findMany({
      where: { products: { some: { isActive: true } } },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    return rows.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      image: b.logoImage ?? '/logo.png',
      count: b._count.products,
    }));
  }, []);
}

export interface AdminPartsBrandVM {
  id: number;
  name: string;
  slug: string;
  logoImage: string | null;
}

export async function getPartsBrandsAdmin(): Promise<AdminPartsBrandVM[]> {
  return safeQuery('getPartsBrandsAdmin', async () => {
    const rows = await prisma.partsBrand.findMany({ orderBy: { name: 'asc' } });
    return rows.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoImage: b.logoImage,
    }));
  }, []);
}

// ── Admin-panel raw shapes (include fields the storefront VMs drop, e.g. slug) ─

export interface AdminCarBrandVM {
  id: number;
  name: string;
  slug: string;
  logoImage: string | null;
  productCount: number;
}

export async function getCarBrandsAdmin(): Promise<AdminCarBrandVM[]> {
  return safeQuery('getCarBrandsAdmin', async () => {
    const rows = await prisma.carBrand.findMany({ orderBy: { name: 'asc' } });
    return rows.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoImage: b.logoImage,
      productCount: b.productCount,
    }));
  }, []);
}

export interface AdminCarModelVM {
  id: number;
  carBrandId: number;
  brandName: string;
  name: string;
  image: string | null;
}

export async function getCarModelsAdmin(): Promise<AdminCarModelVM[]> {
  return safeQuery('getCarModelsAdmin', async () => {
    const rows = await prisma.carModel.findMany({
      include: { carBrand: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((m) => ({
      id: m.id,
      carBrandId: m.carBrandId,
      brandName: m.carBrand.name,
      name: m.name,
      image: m.image,
    }));
  }, []);
}
