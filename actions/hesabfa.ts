'use server';

/**
 * Hesabfa admin Server Actions — manual full sync + webhook registration.
 */

import { getCurrentAdmin } from '@/src/lib/admin-session';
import { getChangeHook, isHesabfaConfigured, setChangeHook } from '@/src/lib/hesabfa/client';
import { fullSyncHesabfa, type FullSyncSummary } from '@/src/lib/hesabfa/sync';
import { fail, ok, runMutation, type ActionResult } from '@/src/lib/result';

export async function getHesabfaIntegrationStatus(): Promise<{
  configured: boolean;
  hookUrl: string | null;
  appWebhookUrl: string | null;
}> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? null;
  const appWebhookUrl = appUrl ? `${appUrl}/api/hesabfa/webhook` : null;

  if (!isHesabfaConfigured()) {
    return { configured: false, hookUrl: null, appWebhookUrl };
  }

  try {
    const hook = await getChangeHook();
    return {
      configured: true,
      hookUrl: hook?.url ?? null,
      appWebhookUrl,
    };
  } catch (err) {
    console.error('[hesabfa:getStatus]', err);
    return { configured: true, hookUrl: null, appWebhookUrl };
  }
}

/** Full sync (categories + products + contacts pull). Admin only. */
export async function forceSyncHesabfa(): Promise<ActionResult<FullSyncSummary>> {
  return runMutation('forceSyncHesabfa', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');

    if (!isHesabfaConfigured()) {
      return fail('حسابفا پیکربندی نشده است (HESABFA_API_KEY / HESABFA_LOGIN_TOKEN).');
    }

    const summary = await fullSyncHesabfa();
    return ok(summary);
  });
}

/** Register/replace Hesabfa change-hook to point at this app. Admin only. */
export async function registerHesabfaWebhook(): Promise<ActionResult<{ url: string }>> {
  return runMutation('registerHesabfaWebhook', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');

    const password = process.env.HESABFA_HOOK_PASSWORD;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!password || !appUrl) {
      return fail('تنظیمات وب‌هوک ناقص است (HESABFA_HOOK_PASSWORD / NEXT_PUBLIC_APP_URL).');
    }
    if (!isHesabfaConfigured()) {
      return fail('حسابفا پیکربندی نشده است.');
    }

    const url = `${appUrl.replace(/\/$/, '')}/api/hesabfa/webhook`;
    await setChangeHook(url, password);
    return ok({ url });
  });
}
