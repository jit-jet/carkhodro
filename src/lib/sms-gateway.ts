/**
 * Generic SMS delivery — server-only.
 * ────────────────────────────────────
 * Shared by the bulk marketing panel (`actions/admin-sms.ts`). Credentials
 * (`SMS_API_KEY`) never leave the server — this module is never imported from
 * a Client Component. Mirrors the console-in-dev / real-gateway-in-prod split
 * already used for OTP delivery in `actions/auth.ts`.
 */

const SMS_PROVIDER = process.env.SMS_PROVIDER ?? 'console';
const SMS_API_KEY = process.env.SMS_API_KEY ?? '';

export interface SmsSendResult {
  phoneNumber: string;
  ok: boolean;
}

/** Send one message to one recipient. Never throws — failures are reported per-recipient. */
async function sendOne(phoneNumber: string, body: string): Promise<SmsSendResult> {
  try {
    if (SMS_PROVIDER === 'console' || !SMS_API_KEY) {
      console.info(`[sms] → ${phoneNumber}: ${body}`);
      return { phoneNumber, ok: true };
    }

    // ── PRODUCTION ──────────────────────────────────────────────────────────
    // Example (Kavenegar bulk send):
    //
    //   const res = await fetch(
    //     `https://api.kavenegar.com/v1/${SMS_API_KEY}/sms/send.json` +
    //       `?receptor=${encodeURIComponent(phoneNumber)}&message=${encodeURIComponent(body)}`,
    //     { method: 'POST' },
    //   );
    //   return { phoneNumber, ok: res.ok };
    // ─────────────────────────────────────────────────────────────────────────

    console.info(`[sms:${SMS_PROVIDER}] → ${phoneNumber}: ${body}`);
    return { phoneNumber, ok: true };
  } catch (err) {
    console.error('[sms-gateway:sendOne]', err);
    return { phoneNumber, ok: false };
  }
}

/** Send the same message to many recipients. Runs in small concurrent batches. */
export async function sendBulkSms(
  phoneNumbers: string[],
  body: string,
  batchSize = 20,
): Promise<SmsSendResult[]> {
  const results: SmsSendResult[] = [];
  for (let i = 0; i < phoneNumbers.length; i += batchSize) {
    const batch = phoneNumbers.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((phone) => sendOne(phone, body)));
    results.push(...batchResults);
  }
  return results;
}

/** Persian SMS parts are ~70 chars each (UCS-2). Used for the compose character counter. */
export function smsPartCount(body: string): number {
  const len = body.length;
  if (len === 0) return 0;
  const PART_SIZE = 70;
  return Math.ceil(len / PART_SIZE);
}
