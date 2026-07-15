'use server';

/**
 * Partner profile Server Actions («پروفایل من»).
 * ───────────────────────────────────────────────
 * Read + update the editable account fields (name, store, referrer, activity,
 * Jalali birth date, delivery address) and manage the avatar. Username, mobile,
 * special code and user type are read-only. Avatars are saved under
 * `public/storage/avatars/`; `users.profile_image` stores only the public path.
 * Per-user / dynamic — never cached.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { USER_ROLE_FA } from '@/src/lib/user-labels';
import { dateToJalaliParts, jalaliPartsToDate } from '@/src/lib/jalali-convert';
import { resolveLocation } from '@/src/lib/resolve-location';
import { deleteFile, saveFile } from '@/src/lib/storage';
import type { ProfileVM } from '@/src/lib/dashboard-types';

const PROFILE_PATH = '/dashboard/profile';
/** Reject avatars over ~1 MB. */
const MAX_AVATAR_BYTES = 1_000_000;

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

      const birth = user.birthDate ? dateToJalaliParts(user.birthDate) : null;

      return {
        phoneNumber: user.phoneNumber,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        shopName: user.shopName ?? '',
        referredBy: user.referredBy ?? '',
        activityField: user.activityField ?? '',
        birthYear: birth ? String(birth.jy) : '',
        birthMonth: birth ? String(birth.jm) : '',
        birthDay: birth ? String(birth.jd) : '',
        provinceId: address?.city.provinceId ?? null,
        cityId: address?.city.id ?? null,
        street: address?.street ?? '',
        postalCode: address?.postalCode ?? '',
        profileImage: user.profileImage,
        partnerCode: user.partnerCode,
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
  referredBy: string;
  activityField: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  provinceId: number | null;
  cityId: number | null;
  street: string;
  postalCode: string;
}

export async function updateProfile(input: ProfileUpdateInput): Promise<ActionResult> {
  return runMutation('updateProfile', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');

    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    if (!firstName) return fail('نام الزامی است.');

    // Birth date: keep only when all three Jalali parts are present + valid.
    let birthDate: Date | null = null;
    if (input.birthYear && input.birthMonth && input.birthDay) {
      birthDate = jalaliPartsToDate(
        Number(input.birthYear),
        Number(input.birthMonth),
        Number(input.birthDay),
      );
      if (!birthDate) return fail('تاریخ تولد نامعتبر است.');
    }

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
          referredBy: input.referredBy.trim() || null,
          activityField: input.activityField.trim() || null,
          birthDate,
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
    return ok(undefined);
  });
}

export async function updateAvatar(formData: FormData): Promise<ActionResult> {
  return runMutation('updateAvatar', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');

    const file = formData.get('avatar');
    if (!(file instanceof File) || file.size === 0) return fail('فایلی انتخاب نشد.');
    if (file.type !== 'image/jpeg') return fail('تصویر باید با پسوند jpg باشد.');
    if (file.size > MAX_AVATAR_BYTES) return fail('حجم تصویر باید کمتر از ۱ مگابایت باشد.');

    const buffer = Buffer.from(await file.arrayBuffer());
    const previous = user.profileImage;
    const profileImage = await saveFile('avatars', `${user.id}.jpg`, buffer);

    await prisma.user.update({
      where: { id: user.id },
      data: { profileImage },
    });

    // Drop legacy data-URL or superseded storage file (same path is a no-op delete).
    if (previous && previous !== profileImage) {
      await deleteFile(previous);
    }

    revalidatePath(PROFILE_PATH);
    revalidatePath('/dashboard');
    return ok(undefined);
  });
}

export async function removeAvatar(): Promise<ActionResult> {
  return runMutation('removeAvatar', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');

    await prisma.user.update({ where: { id: user.id }, data: { profileImage: null } });
    await deleteFile(user.profileImage);

    revalidatePath(PROFILE_PATH);
    revalidatePath('/dashboard');
    return ok(undefined);
  });
}
