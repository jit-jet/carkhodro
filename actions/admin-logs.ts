'use server';

import { prisma } from '@/src/lib/prisma';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import { clampPage, pageCountOf, type AdminPerPage } from '@/src/lib/admin-pagination';
import type { AdminActivityStatus, Prisma } from '@/generated/prisma_client';

export interface AdminLogVM {
  id: string;
  actor: string;
  action: string;
  status: AdminActivityStatus;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
  createdAt: Date;
}

export interface AdminLogsResult {
  items: AdminLogVM[];
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
}

const EMPTY: AdminLogsResult = { items: [], page: 1, pageCount: 1, total: 0, perPage: 20 };

export async function getAdminActivityLogs(input: {
  q?: string;
  status?: AdminActivityStatus;
  page: number;
  perPage: AdminPerPage;
}): Promise<AdminLogsResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ...EMPTY, perPage: input.perPage };

  const q = input.q?.trim().slice(0, 100);
  const where: Prisma.AdminActivityLogWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: 'insensitive' } },
            { actorUsername: { contains: q, mode: 'insensitive' } },
            { ipAddress: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const total = await prisma.adminActivityLog.count({ where });
  const pageCount = pageCountOf(total, input.perPage);
  const page = clampPage(input.page, pageCount);
  const rows = await prisma.adminActivityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * input.perPage,
    take: input.perPage,
    include: { actor: { select: { firstName: true, lastName: true } } },
  });

  return {
    items: rows.map((row) => ({
      id: row.id,
      actor:
        [row.actor?.firstName, row.actor?.lastName].filter(Boolean).join(' ').trim() ||
        row.actorUsername ||
        'ناشناس',
      action: row.action,
      status: row.status,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      reason:
        row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? String((row.metadata as Record<string, unknown>).reason ?? '') || null
          : null,
      createdAt: row.createdAt,
    })),
    page,
    pageCount,
    total,
    perPage: input.perPage,
  };
}
