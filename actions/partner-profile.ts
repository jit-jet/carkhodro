'use server';

/**
 * Partner profile Server Actions («پروفایل من»).
 * ───────────────────────────────────────────────
 * Read + update the editable account fields (name, store, referrer, activity,
 * Jalali birth date, delivery address) and manage the avatar. Username, mobile,
 * special code and user type are read-only. Avatars are stored inline as a
 * base64 JPEG data URL on `users.profile_image` (no external object store), so
 * the panel is self-contained. Per-user / dynamic — never cached.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { USER_ROLE_FA } from '@/src/lib/user-labels';
import { dateToJalaliParts, jalaliPartsToDate } from '@/src/lib/jalali-convert';
import type { ProfileVM } from '@/src/lib/dashboard-types';

const PROFILE_PATH = '/dashboard/profile';
/** Avatars are kept small (inline data URL) — reject anything over ~1 MB. */
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
        province: address?.city.province.name ?? '',
        city: address?.city.name ?? '',
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
  province: string;
  city: string;
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
    const province = input.province.trim();
    const city = input.city.trim();
    const street = input.street.trim();
    const postalCode = input.postalCode.trim();
    const anyAddress = province || city || street || postalCode;
    const fullAddress = province && city && street && /^\d{10}$/.test(postalCode);
    if (anyAddress && !fullAddress) {
      return fail('برای ذخیره آدرس، استان، شهر، آدرس و کد پستی ۱۰ رقمی را کامل کنید.');
    }

    let provinceId: number | null = null;
    if (fullAddress) {
      const provinceRow = await prisma.province.findUnique({ where: { name: province } });
      if (!provinceRow) return fail('استان انتخاب‌شده معتبر نیست.');
      provinceId = provinceRow.id;
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

      if (fullAddress && provinceId !== null) {
        const cityRow = await tx.city.upsert({
          where: { provinceId_name: { provinceId, name: city } },
          create: { provinceId, name: city },
          update: {},
          select: { id: true },
        });
        const existing = await tx.address.findFirst({
          where: { userId: user.id },
          orderBy: { isDefault: 'desc' },
          select: { id: true },
        });
        if (existing) {
          await tx.address.update({
            where: { id: existing.id },
            data: { cityId: cityRow.id, street, postalCode, isDefault: true },
          });
        } else {
          await tx.address.create({
            data: { userId: user.id, cityId: cityRow.id, street, postalCode, isDefault: true },
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
    const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: dataUrl },
    });

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
    revalidatePath(PROFILE_PATH);
    revalidatePath('/dashboard');
    return ok(undefined);
  });
}
