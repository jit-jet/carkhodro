/**
 * IranPayamak (FarazSMS) HTTP client.
 * ───────────────────────────────────
 * Thin wrapper over the public REST API. Uses the `Api-Key` header as documented
 * at https://docs.iranpayamak.com/ — no session login required for send endpoints.
 *
 * Endpoints used:
 *   • POST /ws/v1/sms/pattern — OTP / patterned messages
 *   • POST /ws/v1/sms/simple  — free-text marketing / bulk
 */

import {
  getIranPayamakConfig,
  IranPayamakConfigError,
  requireOtpPattern,
} from './config';
import type {
  ApiMessage,
  ApiResult,
  PatternSendBody,
  SimpleSendBody,
} from './types';

export class IranPayamakError extends Error {
  constructor(
    message: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'IranPayamakError';
  }
}

function formatApiMessage(messages: ApiMessage): string {
  if (messages == null) return 'درخواست پیامک ناموفق بود.';
  if (typeof messages === 'string') return messages || 'درخواست پیامک ناموفق بود.';
  if (Array.isArray(messages)) {
    const joined = messages.filter(Boolean).join(' ');
    return joined || 'درخواست پیامک ناموفق بود.';
  }
  const parts = Object.values(messages).flatMap((v) =>
    Array.isArray(v) ? v : [v],
  );
  const joined = parts.filter(Boolean).join(' ');
  return joined || 'درخواست پیامک ناموفق بود.';
}

async function postJson<T>(
  path: string,
  body: unknown,
): Promise<ApiResult<T>> {
  const { baseUrl, apiKey } = getIranPayamakConfig();

  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  let json: ApiResult<T> | null = null;
  try {
    json = (await res.json()) as ApiResult<T>;
  } catch {
    throw new IranPayamakError(
      `IranPayamak HTTP ${res.status} — پاسخ نامعتبر.`,
      res.status,
    );
  }

  if (!res.ok || json.status === 'error') {
    throw new IranPayamakError(formatApiMessage(json.messages), res.status);
  }

  return json;
}

/**
 * Send a pattern-based OTP SMS.
 * Pattern must already exist in the IranPayamak panel (category OTP recommended).
 * @see https://docs.iranpayamak.com/send-pattern-based-sms-13925177e0
 */
export async function sendPatternOtp(
  recipient: string,
  code: string,
): Promise<void> {
  const config = getIranPayamakConfig();
  const patternCode = requireOtpPattern(config);

  const body: PatternSendBody = {
    code: patternCode,
    recipient,
    attributes: { [config.otpPatternAttr]: code },
    line_number: config.lineNumber,
    number_format: 'persian',
    schedule: null,
  };

  await postJson<number>('/ws/v1/sms/pattern', body);
}

/**
 * Send the same free-text SMS to one or more recipients.
 * @see https://docs.iranpayamak.com/send-simple-sms-13909967e0
 */
export async function sendSimpleSms(
  recipients: string[],
  text: string,
): Promise<void> {
  if (recipients.length === 0) return;

  const config = getIranPayamakConfig();
  const body: SimpleSendBody = {
    text,
    line_number: config.lineNumber,
    recipients,
    number_format: 'persian',
    schedule: null,
  };

  await postJson<number>('/ws/v1/sms/simple', body);
}

export function toUserFacingSmsError(err: unknown): string {
  if (err instanceof IranPayamakConfigError) {
    return 'سرویس پیامک پیکربندی نشده است. با پشتیبانی تماس بگیرید.';
  }
  if (err instanceof IranPayamakError) {
    return 'ارسال پیامک ناموفق بود. لطفاً چند لحظه دیگر دوباره تلاش کنید.';
  }
  return 'ارسال پیامک ناموفق بود. لطفاً دوباره تلاش کنید.';
}
