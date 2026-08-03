'use server';

/**
 * Footer link mutation Server Actions — admin panel. Split out of
 * `actions/footer-links.ts` so `FooterLinksManager` (a Client Component) can
 * import writes without pulling that file's `use cache` read into the browser bundle.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';
import type { FooterLinkGroupVM } from '@/src/lib/serializers';

export interface FooterLinkInput {
  group: FooterLinkGroupVM;
  href: string;
  label: string;
  isActive?: boolean;
}

async function nextSortOrder(group: FooterLinkGroupVM): Promise<number> {
  const { _max } = await prisma.footerLink.aggregate({
    where: { group },
    _max: { sortOrder: true },
  });
  return (_max.sortOrder ?? -1) + 1;
}

export async function createFooterLink(
  input: FooterLinkInput,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('createFooterLink', async () => {
    if (!input.href?.trim() || !input.label?.trim()) {
      return fail('آدرس و عنوان لینک الزامی است.');
    }
    if (input.group !== 'QUICK' && input.group !== 'CATEGORY') {
      return fail('گروه لینک معتبر نیست.');
    }
    const created = await prisma.footerLink.create({
      data: {
        group: input.group,
        href: input.href.trim(),
        label: input.label.trim(),
        isActive: input.isActive ?? true,
        sortOrder: await nextSortOrder(input.group),
      },
      select: { id: true },
    });
    updateTag(tags.footerLinks);
    return ok(created);
  });
}

export async function updateFooterLink(
  id: number,
  input: Partial<FooterLinkInput>,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('updateFooterLink', async () => {
    if (input.group !== undefined && input.group !== 'QUICK' && input.group !== 'CATEGORY') {
      return fail('گروه لینک معتبر نیست.');
    }
    const updated = await prisma.footerLink.update({
      where: { id },
      data: {
        ...(input.group !== undefined ? { group: input.group } : {}),
        ...(input.href !== undefined ? { href: input.href.trim() } : {}),
        ...(input.label !== undefined ? { label: input.label.trim() } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: { id: true },
    });
    updateTag(tags.footerLinks);
    return ok(updated);
  });
}

export async function deleteFooterLink(id: number): Promise<ActionResult> {
  return runMutation('deleteFooterLink', async () => {
    await prisma.footerLink.delete({ where: { id } });
    updateTag(tags.footerLinks);
    return ok(undefined);
  });
}

export async function reorderFooterLinks(
  group: FooterLinkGroupVM,
  orderedIds: number[],
): Promise<ActionResult> {
  return runMutation('reorderFooterLinks', async () => {
    if (orderedIds.length === 0) return ok(undefined);
    if (group !== 'QUICK' && group !== 'CATEGORY') {
      return fail('گروه لینک معتبر نیست.');
    }

    await prisma.$transaction(
      orderedIds.map((linkId, index) =>
        prisma.footerLink.update({
          where: { id: linkId },
          data: { sortOrder: index, group },
        }),
      ),
    );
    updateTag(tags.footerLinks);
    return ok(undefined);
  });
}
