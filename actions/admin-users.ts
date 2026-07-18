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
  accountBalanceToman: number;
  ordersCount: number;
  createdAtLabel: string;
}

export interface AdminUserFilters {
  search?: string;
  role?: UserRole;
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

export async function getUsersAdmin(filters: AdminUserFilters = {}): Promise<AdminUserPage> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 20));

  return safeQuery(
    'getUsersAdmin',
    async () => {
      const search = filters.search?.trim();
      const where = {
        ...(filters.role ? { role: filters.role } : { role: { not: 'ADMIN' as const } }),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
                { phoneNumber: { contains: search } },
                { shopName: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };

      const [rows, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: { _count: { select: { orders: true } } },
          orderBy: { createdAt: 'desc' },
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
