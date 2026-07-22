'use server';

/**
 * Admin communications — comments (reviews), support messages, product suggestions.
 * ─────────────────────────────────────────────────────────────────────────────
 * Read/reply tooling for the admin panel. Does not change storefront submission
 * flows; only adds admin-side list, mark-read, and reply mutations.
 */

import { revalidatePath, updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import { formatJalaliDateTime } from '@/src/lib/format';
import { tags } from '@/actions/cache-tags';
import type { Prisma } from '@/generated/prisma_client';

const COMM_PATH = '/admin/communications';
const ADMIN_HOME = '/admin';

function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

// ── Dashboard unread counts ──────────────────────────────────────────────────

export interface AdminCommunicationCountsVM {
  unreadReviews: number;
  unreadSupport: number;
  unreadSuggestions: number;
}

export async function getAdminCommunicationCounts(): Promise<AdminCommunicationCountsVM> {
  const empty: AdminCommunicationCountsVM = {
    unreadReviews: 0,
    unreadSupport: 0,
    unreadSuggestions: 0,
  };

  return safeQuery(
    'getAdminCommunicationCounts',
    async () => {
      const [unreadReviews, unreadSupport, unreadSuggestions] = await Promise.all([
        prisma.review.count({ where: { isRead: false } }),
        prisma.supportMessage.count({
          where: { direction: 'OUTBOUND', isDeleted: false, adminIsRead: false },
        }),
        prisma.productSuggestion.count({ where: { isRead: false } }),
      ]);
      return { unreadReviews, unreadSupport, unreadSuggestions };
    },
    empty,
  );
}

// ── Reviews (website comments) ───────────────────────────────────────────────

export interface AdminReviewListItemVM {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  authorName: string;
  rating: number;
  text: string;
  isVerifiedPurchase: boolean;
  isRead: boolean;
  hasReply: boolean;
  adminReply: string | null;
  repliedAt: string | null;
  date: string;
}

export interface AdminReviewPage {
  items: AdminReviewListItemVM[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  unreadCount: number;
}

function toReviewItem(r: {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  text: string;
  isVerifiedPurchase: boolean;
  isRead: boolean;
  adminReply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
  product: { name: string; sku: string };
}): AdminReviewListItemVM {
  return {
    id: r.id,
    productId: r.productId,
    productName: r.product.name,
    productSku: r.product.sku,
    authorName: r.authorName,
    rating: r.rating,
    text: r.text,
    isVerifiedPurchase: r.isVerifiedPurchase,
    isRead: r.isRead,
    hasReply: Boolean(r.adminReply),
    adminReply: r.adminReply,
    repliedAt: r.repliedAt ? formatJalaliDateTime(r.repliedAt) : null,
    date: formatJalaliDateTime(r.createdAt),
  };
}

export async function getReviewsAdmin(input?: {
  unreadOnly?: boolean;
  page?: number;
  perPage?: number;
}): Promise<AdminReviewPage> {
  const page = Math.max(1, input?.page ?? 1);
  const perPage = Math.min(50, Math.max(1, input?.perPage ?? 20));
  const empty: AdminReviewPage = {
    items: [],
    total: 0,
    page,
    perPage,
    pageCount: 1,
    unreadCount: 0,
  };

  return safeQuery(
    'getReviewsAdmin',
    async () => {
      const where: Prisma.ReviewWhereInput = input?.unreadOnly
        ? { isRead: false }
        : {};

      const [total, unreadCount, rows] = await Promise.all([
        prisma.review.count({ where }),
        prisma.review.count({ where: { isRead: false } }),
        prisma.review.findMany({
          where,
          include: { product: { select: { name: true, sku: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
      ]);

      return {
        items: rows.map(toReviewItem),
        total,
        page,
        perPage,
        pageCount: Math.max(1, Math.ceil(total / perPage)),
        unreadCount,
      };
    },
    empty,
  );
}

export async function markReviewReadAdmin(id: string): Promise<ActionResult> {
  return runMutation('markReviewReadAdmin', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');

    await prisma.review.updateMany({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath(COMM_PATH);
    revalidatePath(ADMIN_HOME);
    return ok(undefined);
  });
}

export async function replyToReviewAdmin(input: {
  id: string;
  reply: string;
}): Promise<ActionResult> {
  return runMutation('replyToReviewAdmin', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');

    const reply = input.reply?.trim();
    if (!reply) return fail('متن پاسخ را وارد کنید.');

    const review = await prisma.review.findUnique({
      where: { id: input.id },
      select: { id: true, productId: true },
    });
    if (!review) return fail('نظر یافت نشد.');

    await prisma.review.update({
      where: { id: review.id },
      data: {
        adminReply: reply,
        repliedAt: new Date(),
        isRead: true,
      },
    });

    updateTag(tags.reviews(review.productId));
    revalidatePath(COMM_PATH);
    revalidatePath(ADMIN_HOME);
    return ok(undefined);
  });
}

// ── Support messages ─────────────────────────────────────────────────────────

export interface AdminSupportListItemVM {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  shopName: string | null;
  subject: string;
  body: string;
  isRead: boolean;
  date: string;
}

export interface AdminSupportThreadMessageVM {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  subject: string;
  body: string;
  date: string;
  isFromPartner: boolean;
}

export interface AdminSupportPage {
  items: AdminSupportListItemVM[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  unreadCount: number;
}

export async function getSupportMessagesAdmin(input?: {
  unreadOnly?: boolean;
  page?: number;
  perPage?: number;
}): Promise<AdminSupportPage> {
  const page = Math.max(1, input?.page ?? 1);
  const perPage = Math.min(50, Math.max(1, input?.perPage ?? 20));
  const empty: AdminSupportPage = {
    items: [],
    total: 0,
    page,
    perPage,
    pageCount: 1,
    unreadCount: 0,
  };

  return safeQuery(
    'getSupportMessagesAdmin',
    async () => {
      const where: Prisma.SupportMessageWhereInput = {
        direction: 'OUTBOUND',
        isDeleted: false,
        ...(input?.unreadOnly ? { adminIsRead: false } : {}),
      };

      const [total, unreadCount, rows] = await Promise.all([
        prisma.supportMessage.count({ where }),
        prisma.supportMessage.count({
          where: { direction: 'OUTBOUND', isDeleted: false, adminIsRead: false },
        }),
        prisma.supportMessage.findMany({
          where,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
                shopName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
      ]);

      return {
        items: rows.map((m) => ({
          id: m.id,
          userId: m.userId,
          userName: fullName(m.user.firstName, m.user.lastName),
          userPhone: m.user.phoneNumber,
          shopName: m.user.shopName,
          subject: m.subject,
          body: m.body,
          isRead: m.adminIsRead,
          date: formatJalaliDateTime(m.createdAt),
        })),
        total,
        page,
        perPage,
        pageCount: Math.max(1, Math.ceil(total / perPage)),
        unreadCount,
      };
    },
    empty,
  );
}

export async function getSupportThreadAdmin(
  userId: string,
): Promise<AdminSupportThreadMessageVM[]> {
  return safeQuery(
    'getSupportThreadAdmin',
    async () => {
      const rows = await prisma.supportMessage.findMany({
        where: { userId, isDeleted: false },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map((m) => ({
        id: m.id,
        direction: m.direction,
        subject: m.subject,
        body: m.body,
        date: formatJalaliDateTime(m.createdAt),
        isFromPartner: m.direction === 'OUTBOUND',
      }));
    },
    [],
  );
}

export async function markSupportMessageReadAdmin(id: string): Promise<ActionResult> {
  return runMutation('markSupportMessageReadAdmin', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');

    await prisma.supportMessage.updateMany({
      where: { id, direction: 'OUTBOUND' },
      data: { adminIsRead: true },
    });

    revalidatePath(COMM_PATH);
    revalidatePath(ADMIN_HOME);
    return ok(undefined);
  });
}

export async function replyToSupportMessageAdmin(input: {
  messageId: string;
  body: string;
}): Promise<ActionResult> {
  return runMutation('replyToSupportMessageAdmin', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');

    const body = input.body?.trim();
    if (!body) return fail('متن پاسخ را وارد کنید.');

    const original = await prisma.supportMessage.findUnique({
      where: { id: input.messageId },
      select: { id: true, userId: true, subject: true, direction: true },
    });
    if (!original || original.direction !== 'OUTBOUND') {
      return fail('پیام پشتیبانی یافت نشد.');
    }

    const subject = original.subject.startsWith('پاسخ:')
      ? original.subject
      : `پاسخ: ${original.subject}`;

    await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          userId: original.userId,
          direction: 'INBOUND',
          subject,
          body,
          isRead: false,
          adminIsRead: true,
        },
      }),
      prisma.supportMessage.update({
        where: { id: original.id },
        data: { adminIsRead: true },
      }),
    ]);

    revalidatePath('/dashboard/support');
    revalidatePath(COMM_PATH);
    revalidatePath(ADMIN_HOME);
    return ok(undefined);
  });
}

// ── Product suggestions ──────────────────────────────────────────────────────

export interface AdminSuggestionListItemVM {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  shopName: string | null;
  body: string;
  isRead: boolean;
  date: string;
}

export interface AdminSuggestionPage {
  items: AdminSuggestionListItemVM[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  unreadCount: number;
}

export async function getSuggestionsAdmin(input?: {
  unreadOnly?: boolean;
  page?: number;
  perPage?: number;
}): Promise<AdminSuggestionPage> {
  const page = Math.max(1, input?.page ?? 1);
  const perPage = Math.min(50, Math.max(1, input?.perPage ?? 20));
  const empty: AdminSuggestionPage = {
    items: [],
    total: 0,
    page,
    perPage,
    pageCount: 1,
    unreadCount: 0,
  };

  return safeQuery(
    'getSuggestionsAdmin',
    async () => {
      const where: Prisma.ProductSuggestionWhereInput = input?.unreadOnly
        ? { isRead: false }
        : {};

      const [total, unreadCount, rows] = await Promise.all([
        prisma.productSuggestion.count({ where }),
        prisma.productSuggestion.count({ where: { isRead: false } }),
        prisma.productSuggestion.findMany({
          where,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
                shopName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
      ]);

      return {
        items: rows.map((s) => ({
          id: s.id,
          userId: s.userId,
          userName: fullName(s.user.firstName, s.user.lastName),
          userPhone: s.user.phoneNumber,
          shopName: s.user.shopName,
          body: s.body,
          isRead: s.isRead,
          date: formatJalaliDateTime(s.createdAt),
        })),
        total,
        page,
        perPage,
        pageCount: Math.max(1, Math.ceil(total / perPage)),
        unreadCount,
      };
    },
    empty,
  );
}

export async function markSuggestionReadAdmin(id: string): Promise<ActionResult> {
  return runMutation('markSuggestionReadAdmin', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');

    await prisma.productSuggestion.updateMany({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath(COMM_PATH);
    revalidatePath(ADMIN_HOME);
    return ok(undefined);
  });
}
