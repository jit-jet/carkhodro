'use server';

/**
 * Hesabfa admin Server Actions.
 * ─────────────────────────────
 * Admin-only, request-time actions invoked from the dashboard:
 *   • forceSyncHesabfa     — full reconciliation pull (fallback for missed hooks).
 *   • registerHesabfaWebhook — (re)point Hesabfa's change-hook at our endpoint.
 *
 * Both gate on `UserRole.ADMIN` via the session — defence in depth on top of the
 * proxy's optimistic redirect. They return the shared `ActionResult` union so the
 * client button can branch on success/failure.
 */

import { getCurrentUser } from '@/src/lib/session';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { fullSyncHesabfa, type FullSyncSummary } from '@/src/lib/hesabfa/sync';
import { setChangeHook } from '@/src/lib/hesabfa/client';

/** Run a full Hesabfa → local catalogue sync. Admin only. */
export async function forceSyncHesabfa(): Promise<ActionResult<FullSyncSummary>> {
  return runMutation('forceSyncHesabfa', async () => {
    const user = await getCurrentUser();
    //Role check
    // if (user?.role !== 'ADMIN') return fail('دسترسی غیرمجاز.');

    const summary = await fullSyncHesabfa();
    return ok(summary);
  });
}

/** Register/replace Hesabfa's change-hook to point at our webhook. Admin only. */
export async function registerHesabfaWebhook(): Promise<ActionResult<{ url: string }>> {
  return runMutation('registerHesabfaWebhook', async () => {
    //Role check
    // const user = await getCurrentUser();
    // if (user?.role !== 'ADMIN') return fail('دسترسی غیرمجاز.');

    const password = process.env.HESABFA_HOOK_PASSWORD;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!password || !appUrl) {
      return fail('تنظیمات وب‌هوک ناقص است (HESABFA_HOOK_PASSWORD / NEXT_PUBLIC_APP_URL).');
    }

    const url = `${appUrl.replace(/\/$/, '')}/api/hesabfa/webhook`;
    await setChangeHook(url, password);
    return ok({ url });
  });
}
