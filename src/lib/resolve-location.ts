/**
 * Shared province/city validation for the 3 mutating actions that persist a
 * delivery address (signup, partner profile, checkout). Replaces the old
 * "find province by name, upsert city by name" pattern: with the UI now
 * sending `provinceId`/`cityId` from a dropdown that only ever lists seeded
 * rows, there's nothing left that should create a `City` row on the fly — this
 * just validates the given ids exist and belong together.
 */

import type { Prisma } from '@/generated/prisma_client';
import { prisma } from '@/src/lib/prisma';

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

export type ResolveLocationResult =
  | { ok: true; province: { id: number; name: string }; city: { id: number; name: string } }
  | { ok: false; error: string };

export async function resolveLocation(
  provinceId: number,
  cityId: number,
  client: PrismaClientLike = prisma,
): Promise<ResolveLocationResult> {
  const city = await client.city.findUnique({
    where: { id: cityId },
    include: { province: true },
  });

  if (!city) return { ok: false, error: 'شهر انتخاب‌شده معتبر نیست.' };
  if (city.provinceId !== provinceId) {
    return { ok: false, error: 'شهر انتخاب‌شده با استان مطابقت ندارد.' };
  }

  return {
    ok: true,
    province: { id: city.province.id, name: city.province.name },
    city: { id: city.id, name: city.name },
  };
}
