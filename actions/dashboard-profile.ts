'use server';

/**
 * Partner profile Server Actions («پروفایل من»).
 * ───────────────────────────────────────────────
 * Read + update the editable account fields (name, store, activity and delivery
 * address). Username, mobile and user type are read-only.
 * Per-user / dynamic — never cached.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { USER_ROLE_FA } from '@/src/lib/user-labels';
import { resolveLocation } from '@/src/lib/resolve-location';
import type { ProfileVM } from '@/src/lib/dashboard-types';
const PROFILE_PATH = '/dashboard/profile';
const WHOLESALE_PROFILE_LOCKED =
  'کاربران همکار امکان ویرایش اطلاعات حساب خود را ندارند. لطفاً با پشتیبانی تماس بگیرید.';

export async function getProfile(): Promise<ProfileVM | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return safeQuery(
    'getProfile',
    async () => {
      const address = await prisma.address.findFirst({
        where: { userId: user.id },
        include: { city: { include: { province: true } } },
        orderBy: { isDefault: 'desc' },
      });

      return {
        canEdit: user.role !== 'WHOLESALE',
        phoneNumber: user.phoneNumber,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        shopName: user.shopName ?? '',
        activityField: user.activityField ?? '',
        provinceId: address?.city.provinceId ?? null,
        cityId: address?.city.id ?? null,
        street: address?.street ?? '',
        postalCode: address?.postalCode ?? '',
        userType: USER_ROLE_FA[user.role],
      } satisfies ProfileVM;
    },
    null,
  );
}
export interface ProfileUpdateInput {
  firstName: string;
  lastName: string;
  shopName: string;
  activityField: string;
  provinceId: number | null;
  cityId: number | null;
  street: string;
  postalCode: string;
}

export async function updateProfile(input: ProfileUpdateInput): Promise<ActionResult> {
  return runMutation('updateProfile', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');

    if (user.role === 'WHOLESALE') return fail(WHOLESALE_PROFILE_LOCKED);

    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    if (!firstName) return fail('نام الزامی است.');

    // Address is optional, but if the partner starts filling it in they must
    // complete it (province + city + street + a 10-digit postal code).
    const street = input.street.trim();
    const postalCode = input.postalCode.trim();
    const anyAddress = input.provinceId || input.cityId || street || postalCode;
    const fullAddress = input.provinceId && input.cityId && street && /^\d{10}$/.test(postalCode);
    if (anyAddress && !fullAddress) {
      return fail('برای ذخیره آدرس، استان، شهر، آدرس و کد پستی ۱۰ رقمی را کامل کنید.');
    }

    let cityId: number | null = null;
    if (fullAddress) {
      const resolved = await resolveLocation(input.provinceId!, input.cityId!);
      if (!resolved.ok) return fail(resolved.error);
      cityId = resolved.city.id;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName,
          shopName: input.shopName.trim() || null,
          activityField: input.activityField.trim() || null,
        },
      });

      if (fullAddress && cityId !== null) {
        const existing = await tx.address.findFirst({
          where: { userId: user.id },
          orderBy: { isDefault: 'desc' },
          select: { id: true },
        });
        if (existing) {
          await tx.address.update({
            where: { id: existing.id },
            data: { cityId, street, postalCode, isDefault: true },
          });
        } else {
          await tx.address.create({
            data: { userId: user.id, cityId, street, postalCode, isDefault: true },
          });
        }
      }
    });

    revalidatePath(PROFILE_PATH);
    revalidatePath('/dashboard');
    // Website → Hesabfa contact push is intentionally disabled. Profile
    // changes from Hesabfa still flow in via webhook / full sync.
    return ok(undefined);
  });
}
