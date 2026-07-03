'use server';

/**
 * Support / messaging Server Actions («پشتیبانی»).
 * ─────────────────────────────────────────────────
 * A flat, per-partner message log grouped into Inbox (INBOUND), Sent (OUTBOUND)
 * and Deleted (soft-deleted) folders. Sending a message records the partner's
 * OUTBOUND copy and immediately drops an INBOUND auto-acknowledgement from the
 * support desk so the thread feels two-way and the inbox shows an unread badge.
 *
 * Every action resolves the actor from the session cookie → request-time data,
 * never cached, and scopes all reads/writes to that user.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentUser } from '@/src/lib/session';
import { formatJalaliDateTime } from '@/src/lib/format';
import type { MessageDirection } from '@/generated/prisma_client';
import type { SupportInboxVM, SupportMessageVM } from '@/src/lib/dashboard-types';

const SUPPORT_PATH = '/dashboard/support';

function toMessageVM(m: {
  id: string;
  direction: MessageDirection;
  subject: string;
  body: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: Date;
}): SupportMessageVM {
  return {
    id: m.id,
    direction: m.direction,
    subject: m.subject,
    body: m.body,
    isRead: m.isRead,
    isDeleted: m.isDeleted,
    date: formatJalaliDateTime(m.createdAt),
  };
}

export async function getSupportInbox(): Promise<SupportInboxVM> {
  const empty: SupportInboxVM = { inbox: [], sent: [], deleted: [], unreadCount: 0 };
  const user = await getCurrentUser();
  if (!user) return empty;

  return safeQuery(
    'getSupportInbox',
    async () => {
      const messages = await prisma.supportMessage.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      const vms = messages.map(toMessageVM);
      return {
        inbox: vms.filter((m) => m.direction === 'INBOUND' && !m.isDeleted),
        sent: vms.filter((m) => m.direction === 'OUTBOUND' && !m.isDeleted),
        deleted: vms.filter((m) => m.isDeleted),
        unreadCount: vms.filter(
          (m) => m.direction === 'INBOUND' && !m.isDeleted && !m.isRead,
        ).length,
      } satisfies SupportInboxVM;
    },
    empty,
  );
}

export async function sendSupportMessage(input: {
  subject: string;
  body: string;
}): Promise<ActionResult> {
  return runMutation('sendSupportMessage', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('برای ارسال پیام وارد شوید.');

    const subject = input.subject?.trim();
    const body = input.body?.trim();
    if (!subject) return fail('موضوع پیام را وارد کنید.');
    if (!body) return fail('متن پیام را وارد کنید.');

    await prisma.$transaction([
      prisma.supportMessage.create({
        data: { userId: user.id, direction: 'OUTBOUND', subject, body, isRead: true },
      }),
      // Auto-acknowledgement from the support desk → lands in the partner's inbox.
      prisma.supportMessage.create({
        data: {
          userId: user.id,
          direction: 'INBOUND',
          subject: `پاسخ خودکار: ${subject}`,
          body: 'پیام شما دریافت شد. کارشناسان پشتیبانی اسکار در اولین فرصت کاری پاسخ شما را ارسال می‌کنند. از همراهی شما سپاسگزاریم.',
          isRead: false,
        },
      }),
    ]);

    revalidatePath(SUPPORT_PATH);
    return ok(undefined);
  });
}

export async function markMessageRead(id: string): Promise<ActionResult> {
  return runMutation('markMessageRead', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');
    await prisma.supportMessage.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
    revalidatePath(SUPPORT_PATH);
    return ok(undefined);
  });
}

export async function setMessageDeleted(
  id: string,
  isDeleted: boolean,
): Promise<ActionResult> {
  return runMutation('setMessageDeleted', async () => {
    const user = await getCurrentUser();
    if (!user) return fail('ابتدا وارد شوید.');
    await prisma.supportMessage.updateMany({
      where: { id, userId: user.id },
      data: { isDeleted },
    });
    revalidatePath(SUPPORT_PATH);
    return ok(undefined);
  });
}
