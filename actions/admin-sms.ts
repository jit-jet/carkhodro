'use server';

/**
 * Bulk SMS marketing Server Actions — admin panel.
 * ───────────────────────────────────────────────────
 * Sends a single message to every user matching a role filter (Partners /
 * Retail customers / both) and logs the blast as an `SmsCampaign` row (counts
 * + status only — no recipient list is retained).
 */

import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import { sendBulkSms } from '@/src/lib/sms-gateway';
import { formatJalaliDateTime } from '@/src/lib/format';
import type { Prisma, SmsTargetRole, SmsCampaignStatus } from '@/generated/prisma_client';

const TARGET_ROLE_FA: Record<SmsTargetRole, string> = {
  RETAIL: 'مشتریان تک‌فروش',
  WHOLESALE: 'همکاران (عمده)',
  ALL: 'همه کاربران',
};

const STATUS_FA: Record<SmsCampaignStatus, string> = {
  PENDING: 'در انتظار',
  SENT: 'ارسال شد',
  PARTIAL: 'ارسال ناقص',
  FAILED: 'ناموفق',
};

function roleWhereClause(target: SmsTargetRole): Prisma.UserWhereInput {
  if (target === 'ALL') return { role: { in: ['RETAIL', 'WHOLESALE'] } };
  return { role: target };
}

/** Preview how many users a given target filter currently matches. */
export async function getSmsRecipientCount(target: SmsTargetRole): Promise<number> {
  return safeQuery(
    `getSmsRecipientCount:${target}`,
    () => prisma.user.count({ where: roleWhereClause(target) }),
    0,
  );
}

export interface AdminSmsCampaignVM {
  id: string;
  body: string;
  targetRole: SmsTargetRole;
  targetRoleLabel: string;
  recipientCount: number;
  successCount: number;
  failedCount: number;
  status: SmsCampaignStatus;
  statusLabel: string;
  createdByName: string | null;
  createdAtLabel: string;
}

export async function getSmsCampaigns(): Promise<AdminSmsCampaignVM[]> {
  return safeQuery(
    'getSmsCampaigns',
    async () => {
      const rows = await prisma.smsCampaign.findMany({
        include: { createdBy: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return rows.map((r) => ({
        id: r.id,
        body: r.body,
        targetRole: r.targetRole,
        targetRoleLabel: TARGET_ROLE_FA[r.targetRole],
        recipientCount: r.recipientCount,
        successCount: r.successCount,
        failedCount: r.failedCount,
        status: r.status,
        statusLabel: STATUS_FA[r.status],
        createdByName: r.createdBy ? `${r.createdBy.firstName} ${r.createdBy.lastName}`.trim() : null,
        createdAtLabel: formatJalaliDateTime(r.createdAt),
      }));
    },
    [],
  );
}

export async function sendMarketingSms(input: {
  body: string;
  targetRole: SmsTargetRole;
}): Promise<ActionResult<{ campaignId: string; recipientCount: number; successCount: number }>> {
  return runMutation('sendMarketingSms', async () => {
    const body = input.body.trim();
    if (!body) return fail('متن پیامک الزامی است.');
    if (body.length > 900) return fail('متن پیامک بیش از حد طولانی است.');

    const admin = await getCurrentAdmin();

    const recipients = await prisma.user.findMany({
      where: roleWhereClause(input.targetRole),
      select: { phoneNumber: true },
    });

    if (recipients.length === 0) {
      return fail('هیچ کاربری با این فیلتر یافت نشد.');
    }

    const campaign = await prisma.smsCampaign.create({
      data: {
        body,
        targetRole: input.targetRole,
        recipientCount: recipients.length,
        createdById: admin?.id ?? null,
      },
      select: { id: true },
    });

    const results = await sendBulkSms(recipients.map((r) => r.phoneNumber), body);
    const successCount = results.filter((r) => r.ok).length;
    const failedCount = results.length - successCount;

    const status: SmsCampaignStatus =
      failedCount === 0 ? 'SENT' : successCount === 0 ? 'FAILED' : 'PARTIAL';

    await prisma.smsCampaign.update({
      where: { id: campaign.id },
      data: { successCount, failedCount, status, completedAt: new Date() },
    });

    return ok({ campaignId: campaign.id, recipientCount: recipients.length, successCount });
  });
}
