/**
 * IranPayamak env config.
 * ───────────────────────
 * Console / dry-run mode (no real SMS):
 *   • SMS_API_KEY is empty, or
 *   • SMS_API_KEY === "console", or
 *
 * Production needs SMS_API_KEY, SMS_LINE_NUMBER, and (for OTP)
 * SMS_OTP_PATTERN_CODE from the FarazSMS panel.
 */

import 'server-only';
import { getSystemConfig } from '@/src/lib/system-settings';

const DEFAULT_BASE_URL = 'https://api.iranpayamak.com';

export class IranPayamakConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IranPayamakConfigError';
  }
}

/** True when SMS must not hit the network (dev / testing). */
export async function isSmsConsoleMode(): Promise<boolean> {
  const key = (await getSystemConfig()).smsApiKey.trim();
  return key === '' || key === 'console';
}

export interface IranPayamakConfig {
  baseUrl: string;
  apiKey: string;
  lineNumber: string;
  otpPatternCode: string;
  /** Pattern variable name that holds the OTP digits (e.g. "code"). */
  otpPatternAttr: string;
}

/**
 * Validate and return live-send credentials.
 * Throws {@link IranPayamakConfigError} when console mode or misconfigured.
 */
export async function getIranPayamakConfig(): Promise<IranPayamakConfig> {
  const settings = await getSystemConfig();
  if (!settings.smsApiKey || settings.smsApiKey === 'console') {
    throw new IranPayamakConfigError(
      'SMS is in console mode — set a real SMS_API_KEY to send messages.',
    );
  }

  const apiKey = settings.smsApiKey.trim();
  const lineNumber = settings.smsLineNumber.trim();
  const otpPatternCode = settings.smsOtpPatternCode.trim();
  const otpPatternAttr = settings.smsOtpPatternAttr.trim() || 'code';

  if (!apiKey) {
    throw new IranPayamakConfigError('SMS_API_KEY is not configured.');
  }
  if (!lineNumber) {
    throw new IranPayamakConfigError(
      'SMS_LINE_NUMBER is not configured (sender line from IranPayamak panel).',
    );
  }

  return {
    baseUrl:
      settings.smsApiBaseUrl.replace(/\/$/, '') ||
      DEFAULT_BASE_URL,
    apiKey,
    lineNumber,
    otpPatternCode,
    otpPatternAttr,
  };
}

/** OTP send requires a pre-approved pattern code in the panel. */
export function requireOtpPattern(config: IranPayamakConfig): string {
  if (!config.otpPatternCode) {
    throw new IranPayamakConfigError(
      'SMS_OTP_PATTERN_CODE is not configured (create an OTP pattern in IranPayamak panel).',
    );
  }
  return config.otpPatternCode;
}
