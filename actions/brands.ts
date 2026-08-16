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
import { getDefaultImageUrl } from '@/src/lib/default-image';

// ── Car brands / برند خودرو ───────────────────────────────────────────────────

export async function getCarBrands(): Promise<CarBrandVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.carBrands, tags.carModels, tags.products, tags.siteSettings);

  return safeQuery('getCarBrands', async () => {
    const [rows, fallbackImage] = await Promise.all([prisma.carBrand.findMany({
      where: {
        isActive: true,
        carModels: {
          some: {
            isActive: true,
            compatibilities: { some: { product: { isActive: true } } },
          },
        },
      },
      orderBy: { productCount: 'desc' },
    }), getDefaultImageUrl()]);
    return rows.map((row) => toCarBrandVM(row, fallbackImage));
  }, []);
}

// ── Car models / مدل خودرو ───────────────────────────────────────────────────

export async function getCarModels(): Promise<CarModelVM[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.carModels, tags.carBrands, tags.products, tags.siteSettings);

  return safeQuery('getCarModels', async () => {
    const [rows, fallbackImage] = await Promise.all([prisma.carModel.findMany({
      where: {
        isActive: true,
        carBrand: { isActive: true },
        compatibilities: { some: { product: { isActive: true } } },
      },
      include: { carBrand: true },
      orderBy: { id: 'asc' },
    }), getDefaultImageUrl()]);
    return rows.map((row) => toCarModelVM(row, fallbackImage));
  }, []);
}

// ── Parts brands (suppliers) ─────────────────────────────────────────────────

export async function getPartsBrands(): Promise<{ id: number; name: string; slug: string }[]> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.partsBrands);

  return safeQuery('getPartsBrands', async () => {
    const rows = await prisma.partsBrand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((b) => ({ id: b.id, name: b.name, slug: b.slug }));
  }, []);
}

/** Parts brands for the home slider — includes logo + active product counts. */
export async function getPartsBrandsHome(): Promise<
  { id: number; name: string; slug: string; image: string; count: number }[]
> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.partsBrands, tags.products, tags.siteSettings);

  return safeQuery('getPartsBrandsHome', async () => {
    const [rows, fallbackImage] = await Promise.all([prisma.partsBrand.findMany({
      where: { isActive: true, products: { some: { isActive: true } } },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    }), getDefaultImageUrl()]);
    return rows.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      image: b.logoImage?.trim() && b.logoImage !== '/logo.png' ? b.logoImage : fallbackImage,
      count: b._count.products,
    }));
  }, []);
}

/** All active parts brands for the public brands directory. */
export async function getPartsBrandsCatalog(): Promise<
  { id: number; name: string; slug: string; image: string }[]
> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.partsBrands, tags.siteSettings);

  return safeQuery('getPartsBrandsCatalog', async () => {
    const [rows, fallbackImage] = await Promise.all([
      prisma.partsBrand.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, logoImage: true },
      }),
      getDefaultImageUrl(),
    ]);

    return rows.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      image:
        brand.logoImage?.trim() && brand.logoImage !== '/logo.png'
          ? brand.logoImage
          : fallbackImage,
    }));
  }, []);
}

export interface AdminPartsBrandVM {
  id: number;
  name: string;
  slug: string;
  logoImage: string | null;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
}

export async function getPartsBrandsAdmin(): Promise<AdminPartsBrandVM[]> {
  return safeQuery('getPartsBrandsAdmin', async () => {
    const rows = await prisma.partsBrand.findMany({ orderBy: { name: 'asc' } });
    return rows.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoImage: b.logoImage,
      isActive: b.isActive,
      metaTitle: b.metaTitle,
      metaDescription: b.metaDescription,
    }));
  }, []);
}

// ── Admin-panel raw shapes (include fields the storefront VMs drop, e.g. slug) ─

/** Vehicle brand (“برند خودرو”) for admin CRUD. */
export interface AdminCarBrandVM {
  id: number;
  name: string;
  slug: string;
  logoImage: string | null;
  productCount: number;
  isActive: boolean;
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
      isActive: b.isActive,
    }));
  }, []);
}

/** Vehicle model (“مدل خودرو”) for admin CRUD. */
export interface AdminCarModelVM {
  id: number;
  carBrandId: number;
  brandName: string;
  name: string;
  image: string | null;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
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
      isActive: m.isActive,
      metaTitle: m.metaTitle,
      metaDescription: m.metaDescription,
    }));
  }, []);
}
