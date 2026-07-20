'use server';

/**
 * Social link mutation Server Actions — admin panel. Split out of
 * `actions/site-settings.ts` so `SocialLinksManager` (a Client Component) can
 * import writes without pulling that file's `use cache` reads into the bundle.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export interface SocialLinkInput {
  label: string;
  url: string;
  icon: string;
  isActive?: boolean;
}

async function nextSortOrder(): Promise<number> {
  const { _max } = await prisma.socialLink.aggregate({ _max: { sortOrder: true } });
  return (_max.sortOrder ?? -1) + 1;
}

function validateSocialInput(input: SocialLinkInput): string | null {
  if (!input.label?.trim() || !input.url?.trim() || !input.icon?.trim()) {
    return 'عنوان، آدرس و آیکون الزامی است.';
  }
  try {
    const url = new URL(input.url.trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'آدرس باید با http یا https شروع شود.';
    }
  } catch {
    return 'آدرس لینک معتبر نیست.';
  }
  return null;
}

export async function createSocialLink(input: SocialLinkInput): Promise<ActionResult<{ id: number }>> {
  return runMutation('createSocialLink', async () => {
    const validationError = validateSocialInput(input);
    if (validationError) return fail(validationError);

    const created = await prisma.socialLink.create({
      data: {
        label: input.label.trim(),
        url: input.url.trim(),
        icon: input.icon.trim(),
        isActive: input.isActive ?? true,
        sortOrder: await nextSortOrder(),
      },
      select: { id: true },
    });
    updateTag(tags.socialLinks);
    return ok(created);
  });
}

export async function updateSocialLink(
  id: number,
  input: Partial<SocialLinkInput>,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('updateSocialLink', async () => {
    if (input.label !== undefined || input.url !== undefined || input.icon !== undefined) {
      const existing = await prisma.socialLink.findUnique({ where: { id } });
      if (!existing) return fail('لینک یافت نشد.');
      const merged: SocialLinkInput = {
        label: input.label ?? existing.label,
        url: input.url ?? existing.url,
        icon: input.icon ?? existing.icon,
        isActive: input.isActive ?? existing.isActive,
      };
      const validationError = validateSocialInput(merged);
      if (validationError) return fail(validationError);
    }

    const updated = await prisma.socialLink.update({
      where: { id },
      data: {
        ...(input.label !== undefined ? { label: input.label.trim() } : {}),
        ...(input.url !== undefined ? { url: input.url.trim() } : {}),
        ...(input.icon !== undefined ? { icon: input.icon.trim() } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: { id: true },
    });
    updateTag(tags.socialLinks);
    return ok(updated);
  });
}

export async function deleteSocialLink(id: number): Promise<ActionResult> {
  return runMutation('deleteSocialLink', async () => {
    await prisma.socialLink.delete({ where: { id } });
    updateTag(tags.socialLinks);
    return ok(undefined);
  });
}

export async function reorderSocialLinks(orderedIds: number[]): Promise<ActionResult> {
  return runMutation('reorderSocialLinks', async () => {
    if (orderedIds.length === 0) return ok(undefined);

    await prisma.$transaction(
      orderedIds.map((linkId, index) =>
        prisma.socialLink.update({
          where: { id: linkId },
          data: { sortOrder: index },
        }),
      ),
    );
    updateTag(tags.socialLinks);
    return ok(undefined);
  });
}
