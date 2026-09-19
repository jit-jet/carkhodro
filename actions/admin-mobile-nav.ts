'use server';

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export type MobileNavInput = {
  href: string;
  label: string;
  iconUrl: string;
  isActive: boolean;
};

function validate(input: MobileNavInput): string | null {
  const href = input.href.trim();
  if (!input.label.trim() || !href || !input.iconUrl.trim()) return 'آیکون، عنوان و لینک الزامی است.';
  if (input.label.trim().length > 40) return 'عنوان باید حداکثر ۴۰ کاراکتر باشد.';
  if (!href.startsWith('/') || href.startsWith('//') || /[\\\s\u0000-\u001f]/.test(href)) {
    return 'لینک باید یک مسیر داخلی سایت باشد که با / شروع می‌شود.';
  }
  if (!/^\/storage\/settings\/[a-zA-Z0-9._-]+\.(jpg|png|webp)$/.test(input.iconUrl.trim())) {
    return 'آیکون باید از بخش آپلود تصویر انتخاب شود.';
  }
  return null;
}

export async function createMobileNavItem(input: MobileNavInput): Promise<ActionResult<{ id: number; order: number }>> {
  return runMutation('createMobileNavItem', async () => {
    if (!await getCurrentAdmin()) return fail('دسترسی مدیریت لازم است.');
    const error = validate(input);
    if (error) return fail(error);
    const last = await prisma.mobileNavItem.aggregate({ _max: { sortOrder: true } });
    const order = (last._max.sortOrder ?? -1) + 1;
    const row = await prisma.mobileNavItem.create({
      data: { href: input.href.trim(), label: input.label.trim(), iconUrl: input.iconUrl.trim(), isActive: input.isActive, sortOrder: order },
      select: { id: true },
    });
    updateTag(tags.mobileNav);
    return ok({ id: row.id, order });
  });
}

export async function updateMobileNavItem(id: number, input: MobileNavInput): Promise<ActionResult> {
  return runMutation('updateMobileNavItem', async () => {
    if (!await getCurrentAdmin()) return fail('دسترسی مدیریت لازم است.');
    const error = validate(input);
    if (error) return fail(error);
    const result = await prisma.mobileNavItem.updateMany({
      where: { id },
      data: { href: input.href.trim(), label: input.label.trim(), iconUrl: input.iconUrl.trim(), isActive: input.isActive },
    });
    if (!result.count) return fail('مورد پیدا نشد.');
    updateTag(tags.mobileNav);
    return ok(undefined);
  });
}

export async function deleteMobileNavItem(id: number): Promise<ActionResult> {
  return runMutation('deleteMobileNavItem', async () => {
    if (!await getCurrentAdmin()) return fail('دسترسی مدیریت لازم است.');
    const result = await prisma.mobileNavItem.deleteMany({ where: { id } });
    if (!result.count) return fail('مورد پیدا نشد.');
    updateTag(tags.mobileNav);
    return ok(undefined);
  });
}

export async function reorderMobileNavItems(orderedIds: number[]): Promise<ActionResult> {
  return runMutation('reorderMobileNavItems', async () => {
    if (!await getCurrentAdmin()) return fail('دسترسی مدیریت لازم است.');
    const existing = await prisma.mobileNavItem.findMany({ select: { id: true } });
    const ids = new Set(orderedIds);
    if (ids.size !== existing.length || orderedIds.length !== existing.length || existing.some((row) => !ids.has(row.id))) {
      return fail('فهرست ترتیب معتبر نیست. صفحه را تازه‌سازی کنید.');
    }
    await prisma.$transaction(orderedIds.map((id, order) =>
      prisma.mobileNavItem.update({ where: { id }, data: { sortOrder: order } }),
    ));
    updateTag(tags.mobileNav);
    return ok(undefined);
  });
}
