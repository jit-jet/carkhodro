'use server';

/**
 * Car brand / car model / parts brand mutation Server Actions — admin panel.
 * Split out of `actions/brands.ts` so `BrandsManager` (a Client Component) can
 * import writes without pulling that file's `use cache` reads into the browser
 * bundle.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';
import { normalizeSlug } from '@/src/lib/slug';

// ── Car brands ───────────────────────────────────────────────────────────────

export async function createCarBrand(input: {
  name: string;
  slug: string;
  logoImage?: string | null;
}): Promise<ActionResult<{ id: number }>> {
  return runMutation('createCarBrand', async () => {
    if (!input.name?.trim() || !input.slug?.trim()) {
      return fail('نام و اسلاگ برند خودرو الزامی است.');
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

export async function updateCarBrand(
  id: number,
  input: { name?: string; slug?: string; logoImage?: string | null },
): Promise<ActionResult<{ id: number }>> {
  return runMutation('updateCarBrand', async () => {
    const updated = await prisma.carBrand.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
        ...(input.logoImage !== undefined ? { logoImage: input.logoImage } : {}),
      },
      select: { id: true },
    });
    updateTag(tags.carBrands);
    return ok(updated);
  });
}

export async function deleteCarBrand(id: number): Promise<ActionResult> {
  return runMutation('deleteCarBrand', async () => {
    const modelCount = await prisma.carModel.count({ where: { carBrandId: id } });
    if (modelCount > 0) {
      return fail('این برند خودرو دارای مدل خودرو است. ابتدا مدل‌ها را حذف کنید.');
    }
    await prisma.carBrand.delete({ where: { id } });
    updateTag(tags.carBrands);
    return ok(undefined);
  });
}

// ── Car models ───────────────────────────────────────────────────────────────

export async function createCarModel(input: {
  carBrandId: number;
  name: string;
  image?: string | null;
}): Promise<ActionResult<{ id: number }>> {
  return runMutation('createCarModel', async () => {
    if (!input.name?.trim()) return fail('مدل خودرو الزامی است.');
    const created = await prisma.carModel.create({
      data: {
        carBrandId: input.carBrandId,
        name: input.name.trim(),
        image: input.image ?? null,
      },
      select: { id: true },
    });
    updateTag(tags.carModels);
    return ok(created);
  });
}

export async function updateCarModel(
  id: number,
  input: {
    carBrandId?: number;
    name?: string;
    image?: string | null;
  },
): Promise<ActionResult<{ id: number }>> {
  return runMutation('updateCarModel', async () => {
    const updated = await prisma.carModel.update({
      where: { id },
      data: {
        ...(input.carBrandId !== undefined ? { carBrandId: input.carBrandId } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.image !== undefined ? { image: input.image } : {}),
      },
      select: { id: true },
    });
    updateTag(tags.carModels);
    return ok(updated);
  });
}

export async function deleteCarModel(id: number): Promise<ActionResult> {
  return runMutation('deleteCarModel', async () => {
    const compatCount = await prisma.productCompatibility.count({ where: { carModelId: id } });
    if (compatCount > 0) {
      return fail('این مدل خودرو به محصولاتی متصل است. ابتدا اتصال آن‌ها را حذف کنید.');
    }
    await prisma.carModel.delete({ where: { id } });
    updateTag(tags.carModels);
    return ok(undefined);
  });
}

// ── Parts brands ──────────────────────────────────────────────────────────────

export async function createPartsBrand(input: {
  name: string;
  slug: string;
  logoImage?: string | null;
}): Promise<ActionResult<{ id: number }>> {
  return runMutation('createPartsBrand', async () => {
    if (!input.name?.trim()) return fail('نام برند الزامی است.');
    const slug = normalizeSlug(input.slug ?? '');
    if (!slug) return fail('اسلاگ برند الزامی است (فقط حروف انگلیسی، عدد و خط تیره).');
    const created = await prisma.partsBrand.create({
      data: {
        name: input.name.trim(),
        slug,
        logoImage: input.logoImage ?? null,
      },
      select: { id: true },
    });
    updateTag(tags.partsBrands);
    return ok(created);
  });
}

export async function updatePartsBrand(
  id: number,
  input: { name?: string; slug?: string; logoImage?: string | null },
): Promise<ActionResult<{ id: number }>> {
  return runMutation('updatePartsBrand', async () => {
    let slug: string | undefined;
    if (input.slug !== undefined) {
      slug = normalizeSlug(input.slug);
      if (!slug) return fail('اسلاگ برند الزامی است (فقط حروف انگلیسی، عدد و خط تیره).');
    }
    const updated = await prisma.partsBrand.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(input.logoImage !== undefined ? { logoImage: input.logoImage } : {}),
      },
      select: { id: true },
    });
    updateTag(tags.partsBrands);
    return ok(updated);
  });
}

export async function deletePartsBrand(id: number): Promise<ActionResult> {
  return runMutation('deletePartsBrand', async () => {
    const productCount = await prisma.product.count({ where: { partsBrandId: id } });
    if (productCount > 0) {
      return fail('این برند به محصولاتی متصل است. ابتدا آن‌ها را حذف یا ویرایش کنید.');
    }
    await prisma.partsBrand.delete({ where: { id } });
    updateTag(tags.partsBrands);
    return ok(undefined);
  });
}
