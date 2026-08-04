'use server';

/**
 * Hero banner mutation Server Actions — admin panel.
 * Static copy lives on SiteSetting; image slides on HeroBanner.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';
import { deleteFile } from '@/src/lib/storage';
import type { HeroContentVM } from '@/src/lib/serializers';

export type HeroContentInput = HeroContentVM;

export interface HeroBannerInput {
  imageUrl: string;
  isActive?: boolean;
}

async function nextSortOrder(): Promise<number> {
  const { _max } = await prisma.heroBanner.aggregate({ _max: { sortOrder: true } });
  return (_max.sortOrder ?? -1) + 1;
}

function isValidHref(href: string): boolean {
  const value = href.trim();
  if (!value) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function validateHeroContent(input: HeroContentInput): string | null {
  if (!input.title?.trim()) return 'عنوان الزامی است.';
  if (!input.description?.trim()) return 'توضیحات الزامی است.';
  if (!input.button1Text?.trim()) return 'متن دکمه اول الزامی است.';
  if (!input.button1Href?.trim() || !isValidHref(input.button1Href)) {
    return 'لینک دکمه اول معتبر نیست (مسیر داخلی یا http/https).';
  }

  const b2Text = input.button2Text?.trim() || '';
  const b2Href = input.button2Href?.trim() || '';
  if ((b2Text && !b2Href) || (!b2Text && b2Href)) {
    return 'متن و لینک دکمه دوم باید هر دو پر شوند یا هر دو خالی بمانند.';
  }
  if (b2Href && !isValidHref(b2Href)) {
    return 'لینک دکمه دوم معتبر نیست (مسیر داخلی یا http/https).';
  }

  return null;
}

export async function updateHeroContent(input: HeroContentInput): Promise<ActionResult> {
  return runMutation('updateHeroContent', async () => {
    const validationError = validateHeroContent(input);
    if (validationError) return fail(validationError);

    const data = {
      heroTitle: input.title.trim(),
      heroDescription: input.description.trim(),
      heroButton1Text: input.button1Text.trim(),
      heroButton1Href: input.button1Href.trim(),
      heroButton2Text: input.button2Text.trim() || null,
      heroButton2Href: input.button2Href.trim() || null,
    };

    await prisma.siteSetting.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    updateTag(tags.heroBanners);
    updateTag(tags.siteSettings);
    return ok(undefined);
  });
}

export async function createHeroBanner(
  input: HeroBannerInput,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('createHeroBanner', async () => {
    if (!input.imageUrl?.trim()) return fail('تصویر بنر الزامی است.');

    const created = await prisma.heroBanner.create({
      data: {
        imageUrl: input.imageUrl.trim(),
        isActive: input.isActive ?? true,
        sortOrder: await nextSortOrder(),
      },
      select: { id: true },
    });
    updateTag(tags.heroBanners);
    return ok(created);
  });
}

export async function updateHeroBanner(
  id: number,
  input: Partial<HeroBannerInput>,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('updateHeroBanner', async () => {
    const existing = await prisma.heroBanner.findUnique({ where: { id } });
    if (!existing) return fail('بنر یافت نشد.');

    const imageUrl = input.imageUrl !== undefined ? input.imageUrl.trim() : existing.imageUrl;
    if (!imageUrl) return fail('تصویر بنر الزامی است.');

    const updated = await prisma.heroBanner.update({
      where: { id },
      data: {
        imageUrl,
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: { id: true },
    });

    if (input.imageUrl !== undefined && existing.imageUrl !== imageUrl) {
      await deleteFile(existing.imageUrl);
    }

    updateTag(tags.heroBanners);
    return ok(updated);
  });
}

export async function deleteHeroBanner(id: number): Promise<ActionResult> {
  return runMutation('deleteHeroBanner', async () => {
    const existing = await prisma.heroBanner.findUnique({ where: { id } });
    if (!existing) return fail('بنر یافت نشد.');

    await prisma.heroBanner.delete({ where: { id } });
    await deleteFile(existing.imageUrl);
    updateTag(tags.heroBanners);
    return ok(undefined);
  });
}

export async function reorderHeroBanners(orderedIds: number[]): Promise<ActionResult> {
  return runMutation('reorderHeroBanners', async () => {
    if (orderedIds.length === 0) return ok(undefined);

    await prisma.$transaction(
      orderedIds.map((bannerId, index) =>
        prisma.heroBanner.update({
          where: { id: bannerId },
          data: { sortOrder: index },
        }),
      ),
    );
    updateTag(tags.heroBanners);
    return ok(undefined);
  });
}
