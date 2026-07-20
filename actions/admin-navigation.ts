'use server';

/**
 * Nav link mutation Server Actions — admin panel. Split out of
 * `actions/navigation.ts` so `NavLinksManager` (a Client Component) can import
 * writes without pulling that file's `use cache` read into the browser bundle.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export interface NavLinkInput {
  href: string;
  label: string;
  isActive?: boolean;
}

async function nextSortOrder(): Promise<number> {
  const { _max } = await prisma.navLink.aggregate({ _max: { sortOrder: true } });
  return (_max.sortOrder ?? -1) + 1;
}

export async function createNavLink(input: NavLinkInput): Promise<ActionResult<{ id: number }>> {
  return runMutation('createNavLink', async () => {
    if (!input.href?.trim() || !input.label?.trim()) {
      return fail('آدرس و عنوان لینک الزامی است.');
    }
    const created = await prisma.navLink.create({
      data: {
        href: input.href.trim(),
        label: input.label.trim(),
        isActive: input.isActive ?? true,
        sortOrder: await nextSortOrder(),
      },
      select: { id: true },
    });
    updateTag(tags.navLinks);
    return ok(created);
  });
}

export async function updateNavLink(
  id: number,
  input: Partial<NavLinkInput>,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('updateNavLink', async () => {
    const updated = await prisma.navLink.update({
      where: { id },
      data: {
        ...(input.href !== undefined ? { href: input.href.trim() } : {}),
        ...(input.label !== undefined ? { label: input.label.trim() } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: { id: true },
    });
    updateTag(tags.navLinks);
    return ok(updated);
  });
}

export async function deleteNavLink(id: number): Promise<ActionResult> {
  return runMutation('deleteNavLink', async () => {
    await prisma.navLink.delete({ where: { id } });
    updateTag(tags.navLinks);
    return ok(undefined);
  });
}

export async function reorderNavLinks(orderedIds: number[]): Promise<ActionResult> {
  return runMutation('reorderNavLinks', async () => {
    if (orderedIds.length === 0) return ok(undefined);

    await prisma.$transaction(
      orderedIds.map((linkId, index) =>
        prisma.navLink.update({
          where: { id: linkId },
          data: { sortOrder: index },
        }),
      ),
    );
    updateTag(tags.navLinks);
    return ok(undefined);
  });
}
