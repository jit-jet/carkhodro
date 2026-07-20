/**
 * Generic SMS delivery — server-only.
 * ────────────────────────────────────
 * Shared by OTP login (`actions/auth.ts`) and bulk marketing
 * (`actions/admin-sms.ts`). Credentials never leave the server.
 *
 * Console mode (no network): SMS_API_KEY empty / "console", or
 * bulk SMS is logged only.
 *
 * Live mode: IranPayamak / FarazSMS public API
 * (https://docs.iranpayamak.com/).
 */

import { isSmsConsoleMode } from '@/src/lib/iranpayamak/config';
import {
  sendPatternOtp,
  sendSimpleSms,
  toUserFacingSmsError,
} from '@/src/lib/iranpayamak/client';

export { isSmsConsoleMode };

export interface SmsSendResult {
  phoneNumber: string;
  ok: boolean;
}

export type SendOtpResult =
  | { ok: true; consoleMode: boolean }
  | { ok: false; error: string; consoleMode: boolean };

/**
 * Deliver a login verification code.
 * In console mode: logs only (caller should expose the code via `devCode` + alert).
 * In live mode: IranPayamak pattern SMS.
 */
export async function sendOtpSms(
  phoneNumber: string,
  code: string,
): Promise<SendOtpResult> {
  if (isSmsConsoleMode()) {
    console.info(`[otp] code for ${phoneNumber}: ${code} (console — no SMS sent)`);
    return { ok: true, consoleMode: true };
  }

  try {
    await sendPatternOtp(phoneNumber, code);
    return { ok: true, consoleMode: false };
  } catch (err) {
    console.error('[sms-gateway:sendOtpSms]', err);
    return {
      ok: false,
      error: toUserFacingSmsError(err),
      consoleMode: false,
    };
  }
}

/** Send one free-text message to one recipient. Never throws. */
async function sendOne(phoneNumber: string, body: string): Promise<SmsSendResult> {
  try {
    if (isSmsConsoleMode()) {
      console.info(`[sms] → ${phoneNumber}: ${body}`);
      return { phoneNumber, ok: true };
    }

    await sendSimpleSms([phoneNumber], body);
    return { phoneNumber, ok: true };
  } catch (err) {
    console.error('[sms-gateway:sendOne]', err);
    return { phoneNumber, ok: false };
  }
}

/**
 * Send the same marketing message to many recipients.
 * Live mode batches recipients into fewer IranPayamak simple-SMS calls.
 */
export async function sendBulkSms(
  phoneNumbers: string[],
  body: string,
  batchSize = 50,
): Promise<SmsSendResult[]> {
  if (isSmsConsoleMode()) {
    const results: SmsSendResult[] = [];
    for (const phone of phoneNumbers) {
      console.info(`[sms] → ${phone}: ${body}`);
      results.push({ phoneNumber: phone, ok: true });
    }
    return results;
  }

  const results: SmsSendResult[] = [];
  for (let i = 0; i < phoneNumbers.length; i += batchSize) {
    const batch = phoneNumbers.slice(i, i + batchSize);
    try {
      await sendSimpleSms(batch, body);
      for (const phone of batch) {
        results.push({ phoneNumber: phone, ok: true });
      }
    } catch (err) {
      console.error('[sms-gateway:sendBulkSms]', err);
      // Fall back to per-number sends so a single bad number does not fail the batch.
      const fallback = await Promise.all(batch.map((phone) => sendOne(phone, body)));
      results.push(...fallback);
    }
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
