import 'server-only';

import { headers } from 'next/headers';
import { prisma } from '@/src/lib/prisma';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import type { AdminActivityStatus, Prisma } from '@/generated/prisma_client';

export const AUDITED_ADMIN_ACTIONS = new Set([
  'adminLogout',
  'createCarBrand', 'updateCarBrand', 'deleteCarBrand',
  'createCarModel', 'updateCarModel', 'deleteCarModel',
  'createPartsBrand', 'updatePartsBrand', 'deletePartsBrand',
  'createCategory', 'updateCategory', 'deleteCategory',
  'markReviewReadAdmin', 'replyToReviewAdmin', 'setReviewHiddenAdmin', 'deleteReviewAdmin',
  'markSupportMessageReadAdmin', 'replyToSupportMessageAdmin', 'markSuggestionReadAdmin',
  'createDiscountCode', 'updateDiscountCode', 'deleteDiscountCode', 'setDiscountCodeActive',
  'createFaq', 'updateFaq', 'deleteFaq',
  'createFooterLink', 'updateFooterLink', 'deleteFooterLink', 'reorderFooterLinks',
  'updateHeroContent', 'createHeroBanner', 'updateHeroBanner', 'deleteHeroBanner', 'reorderHeroBanners',
  'createNavLink', 'updateNavLink', 'deleteNavLink', 'reorderNavLinks',
  'updateOrderStatusAdmin', 'updateOrderAdmin',
  'createPostCategory', 'updatePostCategory', 'deletePostCategory',
  'createPost', 'updatePost', 'setPostPublished', 'deletePost',
  'createProduct', 'updateProduct', 'deleteProduct', 'permanentlyDeleteProduct',
  'reactivateProduct', 'bulkUpdateProducts', 'uploadProductImage',
  'updateRulesContent', 'updateReturnContent', 'updateSiteSettings',
  'createShippingOption', 'updateShippingOption', 'deleteShippingOption',
  'sendMarketingSms',
  'createSocialLink', 'updateSocialLink', 'deleteSocialLink', 'reorderSocialLinks',
  'updateSystemSettings', 'uploadAdminImage',
  'updateUser', 'setUserActive', 'updateUserRole',
  'forceSyncHesabfa', 'registerHesabfaWebhook',
]);

interface RequestSnapshot {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AdminAuditContext extends RequestSnapshot {
  actorId: string;
  actorUsername: string | null;
}

async function requestSnapshot(): Promise<RequestSnapshot> {
  try {
    const store = await headers();
    const forwarded = store.get('x-forwarded-for')?.split(',')[0]?.trim();
    return {
      ipAddress: (forwarded || store.get('x-real-ip'))?.slice(0, 64) ?? null,
      userAgent: store.get('user-agent')?.slice(0, 512) ?? null,
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

export async function captureAdminAuditContext(action: string): Promise<AdminAuditContext | null> {
  if (!AUDITED_ADMIN_ACTIONS.has(action)) return null;
  try {
    const [admin, request] = await Promise.all([getCurrentAdmin(), requestSnapshot()]);
    if (!admin) return null;
    return { actorId: admin.id, actorUsername: admin.username, ...request };
  } catch {
    return null;
  }
}

interface WriteAuditInput extends RequestSnapshot {
  actorId?: string | null;
  actorUsername?: string | null;
  action: string;
  status: AdminActivityStatus;
  metadata?: Prisma.InputJsonValue;
}

async function writeAudit(input: WriteAuditInput): Promise<void> {
  try {
    await prisma.adminActivityLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorUsername: input.actorUsername?.slice(0, 128) ?? null,
        action: input.action.slice(0, 128),
        status: input.status,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.error('[admin-audit] write failed', error instanceof Error ? error.name : 'unknown');
  }
}

export async function recordAdminMutation(
  context: AdminAuditContext | null,
  action: string,
  status: 'SUCCESS' | 'FAILURE',
): Promise<void> {
  if (!context) return;
  await writeAudit({ ...context, action, status });
}

export async function recordAdminLoginAttempt(input: {
  actorId?: string | null;
  attemptedUsername: string;
  status: AdminActivityStatus;
  reason: 'invalid_credentials' | 'locked' | 'inactive' | 'success';
}): Promise<void> {
  const request = await requestSnapshot();
  await writeAudit({
    ...request,
    actorId: input.actorId,
    actorUsername: input.attemptedUsername,
    action: 'adminLogin',
    status: input.status,
    metadata: { reason: input.reason },
  });
}
