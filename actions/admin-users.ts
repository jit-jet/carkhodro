'use server';

/**
 * User management Server Actions — admin panel only.
 * ────────────────────────────────────────────────────
 * List/search customers + partners and assign the WHOLESALE ("همکار"/Partner)
 * role. Deliberately uncached: the admin table must reflect writes instantly.
 * Whole file is `use server` (no `use cache` mixed in) since `UsersTable` (a
 * Client Component) imports `updateUserRole` directly — see the note atop
 * `actions/products.ts`. `ASSIGNABLE_ROLES` moved to `src/lib/admin-options.ts`
 * since a `use server` file may only export async functions.
 */

import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { formatJalaliDate } from '@/src/lib/format';
import { USER_ROLE_FA } from '@/src/lib/user-labels';
import { ASSIGNABLE_ROLES } from '@/src/lib/admin-options';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import { dateToJalaliParts, jalaliPartsToDate } from '@/src/lib/jalali-convert';
import { resolveLocation } from '@/src/lib/resolve-location';
import { deleteFile, saveFile } from '@/src/lib/storage';
import type { UserRole } from '@/generated/prisma_client';

export interface AdminUserListItemVM {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  roleLabel: string;
  shopName: string | null;
  partnerCode: string | null;
  isVerified: boolean;
  isActive: boolean;
  accountBalanceToman: number;
  ordersCount: number;
  createdAtLabel: string;
}

export type AdminUserSortBy =
  | 'name'
  | 'phone'
  | 'role'
  | 'orders'
  | 'balance'
  | 'createdAt';

export type AdminUserSortDir = 'asc' | 'desc';

export interface AdminUserFilters {
  search?: string;
  phone?: string;
  role?: UserRole;
  /** `active` | `inactive` — omit for all */
  status?: 'active' | 'inactive';
  sortBy?: AdminUserSortBy;
  sortDir?: AdminUserSortDir;
  page?: number;
  perPage?: number;
}

export interface AdminUserPage {
  items: AdminUserListItemVM[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

function adminUserOrderBy(
  sortBy: AdminUserSortBy | undefined,
  sortDir: AdminUserSortDir | undefined,
) {
  const dir = sortDir === 'asc' ? ('asc' as const) : ('desc' as const);
  switch (sortBy) {
    case 'name':
      return [{ firstName: dir }, { lastName: dir }];
    case 'phone':
      return { phoneNumber: dir };
    case 'role':
      return { role: dir };
    case 'orders':
      return { orders: { _count: dir } };
    case 'balance':
      return { accountBalance: dir };
    case 'createdAt':
      return { createdAt: dir };
    default:
      return { createdAt: 'desc' as const };
  }
}

export async function getUsersAdmin(filters: AdminUserFilters = {}): Promise<AdminUserPage> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 20));

  return safeQuery(
    'getUsersAdmin',
    async () => {
      const search = filters.search?.trim();
      const phone = filters.phone?.trim();
      const where = {
        ...(filters.role ? { role: filters.role } : { role: { not: 'ADMIN' as const } }),
        ...(filters.status === 'active'
          ? { isActive: true }
          : filters.status === 'inactive'
            ? { isActive: false }
            : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
                { shopName: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
        ...(phone ? { phoneNumber: { contains: phone } } : {}),
      };

      const orderBy = adminUserOrderBy(filters.sortBy, filters.sortDir);

      const [rows, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: { _count: { select: { orders: true } } },
          orderBy,
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.user.count({ where }),
      ]);

      return {
        items: rows.map((u) => ({
          id: u.id,
          fullName: `${u.firstName} ${u.lastName}`.trim(),
          phoneNumber: u.phoneNumber,
          role: u.role,
          roleLabel: USER_ROLE_FA[u.role],
          shopName: u.shopName,
          partnerCode: u.partnerCode,
          isVerified: u.isVerified,
          isActive: u.isActive,
          accountBalanceToman: Number(u.accountBalance),
          ordersCount: u._count.orders,
          createdAtLabel: formatJalaliDate(u.createdAt),
        })),
        total,
        page,
        perPage,
        pageCount: Math.max(1, Math.ceil(total / perPage)),
      };
    },
    { items: [], total: 0, page, perPage, pageCount: 1 },
  );
}

export async function getUserAdminById(id: string) {
  return safeQuery(
    `getUserAdminById:${id}`,
    async () => {
      const u = await prisma.user.findUnique({
        where: { id },
        include: {
          addresses: {
            include: { city: { include: { province: true } } },
            orderBy: { isDefault: 'desc' },
            take: 1,
          },
        },
      });
      if (!u) return null;
      if (u.role === 'ADMIN') return null;

      const address = u.addresses[0] ?? null;
      const birth = u.birthDate ? dateToJalaliParts(u.birthDate) : null;

      return {
        id: u.id,
        phoneNumber: u.phoneNumber,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isVerified: u.isVerified,
        isActive: u.isActive,
        shopName: u.shopName,
        referredBy: u.referredBy,
        activityField: u.activityField,
        partnerCode: u.partnerCode,
        profileImage: u.profileImage,
        accountBalanceToman: Number(u.accountBalance),
        birthYear: birth ? String(birth.jy) : '',
        birthMonth: birth ? String(birth.jm) : '',
        birthDay: birth ? String(birth.jd) : '',
        provinceId: address?.city.provinceId ?? null,
        cityId: address?.city.id ?? null,
        street: address?.street ?? '',
        postalCode: address?.postalCode ?? '',
        createdAtLabel: formatJalaliDate(u.createdAt),
      };
    },
    null,
  );
}

export interface AdminUserUpdateInput {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  shopName?: string | null;
  referredBy?: string | null;
  activityField?: string | null;
  partnerCode?: string | null;
  accountBalanceToman?: number;
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  provinceId?: number | null;
  cityId?: number | null;
  street?: string;
  postalCode?: string;
}

export async function updateUser(
  userId: string,
  input: AdminUserUpdateInput,
): Promise<ActionResult> {
  return runMutation('updateUser', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی مجاز نیست.');

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });
    if (!target) return fail('کاربر پیدا نشد.');
    if (target.role === 'ADMIN' || target.role === 'SUPPORT') {
      return fail('اطلاعات مدیران از این بخش قابل تغییر نیست.');
    }
    if (!ASSIGNABLE_ROLES.includes(input.role)) {
      return fail('این نقش از این بخش قابل تنظیم نیست.');
    }

    if (!input.firstName?.trim() || !input.lastName?.trim()) {
      return fail('نام و نام خانوادگی الزامی است.');
    }

    let partnerCode = input.partnerCode?.trim() || null;
    if (input.role === 'RETAIL') partnerCode = null;
    if (partnerCode) {
      const codeTaken = await prisma.user.findFirst({
        where: { partnerCode, id: { not: userId } },
        select: { id: true },
      });
      if (codeTaken) return fail('این کد اختصاصی قبلاً استفاده شده است.');
    }

    let birthDate: Date | null = null;
    if (input.birthYear && input.birthMonth && input.birthDay) {
      birthDate = jalaliPartsToDate(
        Number(input.birthYear),
        Number(input.birthMonth),
        Number(input.birthDay),
      );
      if (!birthDate) return fail('تاریخ تولد نامعتبر است.');
    }

    const street = (input.street ?? '').trim();
    const postalCode = (input.postalCode ?? '').trim();
    const anyAddress = input.provinceId || input.cityId || street || postalCode;
    const fullAddress =
      Boolean(input.provinceId) &&
      Boolean(input.cityId) &&
      Boolean(street) &&
      /^\d{10}$/.test(postalCode);
    if (anyAddress && !fullAddress) {
      return fail('برای ذخیره آدرس، استان، شهر، آدرس و کد پستی ۱۰ رقمی را کامل کنید.');
    }

    let cityId: number | null = null;
    if (fullAddress) {
      const resolved = await resolveLocation(input.provinceId!, input.cityId!);
      if (!resolved.ok) return fail(resolved.error);
      cityId = resolved.city.id;
    }

    const deactivating = target.isActive && !input.isActive;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          role: input.role,
          isVerified: input.isVerified,
          isActive: input.isActive,
          shopName: input.shopName?.trim() || null,
          referredBy: input.referredBy?.trim() || null,
          activityField: input.activityField?.trim() || null,
          partnerCode,
          birthDate,
          ...(input.accountBalanceToman !== undefined
            ? { accountBalance: BigInt(Math.round(input.accountBalanceToman)) }
            : {}),
        },
      });

      if (deactivating) {
        await tx.session.deleteMany({ where: { userId } });
      }

      if (fullAddress && cityId !== null) {
        const existing = await tx.address.findFirst({
          where: { userId },
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
            data: { userId, cityId, street, postalCode, isDefault: true },
          });
        }
      } else if (!anyAddress) {
        // Clear address when admin empties all address fields.
        await tx.address.deleteMany({ where: { userId } });
      }
    });

    return ok(undefined);
  });
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<ActionResult> {
  return runMutation('setUserActive', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی مجاز نیست.');

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });
    if (!target) return fail('کاربر پیدا نشد.');
    if (target.role === 'ADMIN' || target.role === 'SUPPORT') {
      return fail('وضعیت مدیران از این بخش قابل تغییر نیست.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { isActive } });
      if (!isActive) {
        await tx.session.deleteMany({ where: { userId } });
      }
    });

    return ok(undefined);
  });
}

const MAX_AVATAR_BYTES = 1_000_000;

export async function uploadUserAvatarAdmin(
  userId: string,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  return runMutation('uploadUserAvatarAdmin', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی مجاز نیست.');

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, profileImage: true },
    });
    if (!target) return fail('کاربر پیدا نشد.');
    if (target.role === 'ADMIN' || target.role === 'SUPPORT') {
      return fail('تصویر مدیران از این بخش قابل تغییر نیست.');
    }

    const file = formData.get('avatar');
    if (!(file instanceof File) || file.size === 0) return fail('فایلی انتخاب نشد.');
    if (file.type !== 'image/jpeg') return fail('تصویر باید با پسوند jpg باشد.');
    if (file.size > MAX_AVATAR_BYTES) return fail('حجم تصویر باید کمتر از ۱ مگابایت باشد.');

    const buffer = Buffer.from(await file.arrayBuffer());
    const previous = target.profileImage;
    const profileImage = await saveFile('avatars', `${userId}.jpg`, buffer);

    await prisma.user.update({
      where: { id: userId },
      data: { profileImage },
    });

    if (previous && previous !== profileImage) {
      await deleteFile(previous);
    }

    return ok({ url: profileImage });
  });
}

export async function removeUserAvatarAdmin(userId: string): Promise<ActionResult> {
  return runMutation('removeUserAvatarAdmin', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی مجاز نیست.');

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, profileImage: true },
    });
    if (!target) return fail('کاربر پیدا نشد.');
    if (target.role === 'ADMIN' || target.role === 'SUPPORT') {
      return fail('تصویر مدیران از این بخش قابل تغییر نیست.');
    }

    await prisma.user.update({ where: { id: userId }, data: { profileImage: null } });
    await deleteFile(target.profileImage);
    return ok(undefined);
  });
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<ActionResult> {
  return runMutation('updateUserRole', async () => {
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return fail('این نقش از این بخش قابل تنظیم نیست.');
    }
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target) return fail('کاربر پیدا نشد.');
    if (target.role === 'ADMIN' || target.role === 'SUPPORT') {
      return fail('نقش مدیران از این بخش قابل تغییر نیست.');
    }

    await prisma.user.update({ where: { id: userId }, data: { role } });
    return ok(undefined);
  });
}
