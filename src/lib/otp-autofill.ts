import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export const OTP_INPUT_LENGTH = 4;

/** Accept ASCII, Persian, or Arabic-Indic digits from keyboards and SMS. */
export function normalizeOtpCode(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/\D/g, '')
    .slice(0, OTP_INPUT_LENGTH);
}

interface SmsOtpPlugin {
  start(): Promise<void>;
  stop(): Promise<void>;
  addListener(
    eventName: 'codeReceived',
    listener: (event: { code: string }) => void,
  ): Promise<PluginListenerHandle>;
}

const NativeSmsOtp = registerPlugin<SmsOtpPlugin>('SmsOtp');

/** Start Android SMS consent before the server sends the SMS. */
export function startSmsCodeCapture(onCode: (code: string) => void): {
  ready: Promise<void>;
  stop: () => Promise<void>;
} {
  let active = true;
  let nativeListener: PluginListenerHandle | null = null;

  const receiveCode = (value: string) => {
    const code = normalizeOtpCode(value);
    if (active && code.length === OTP_INPUT_LENGTH) onCode(code);
  };

  const ready = (async () => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        nativeListener = await NativeSmsOtp.addListener('codeReceived', ({ code }) => receiveCode(code));
        if (!active) {
          void nativeListener.remove().catch(() => undefined);
          return;
        }
        await NativeSmsOtp.start();
        if (!active) void NativeSmsOtp.stop().catch(() => undefined);
        return;
      } catch {
        // Older APKs without the native bridge keep manual code entry.
        if (nativeListener) void nativeListener.remove().catch(() => undefined);
      }
    }
  })();

  return {
    ready,
    stop: async () => {
      active = false;
      const operations: Promise<unknown>[] = [];
      if (nativeListener) operations.push(nativeListener.remove());
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        operations.push(NativeSmsOtp.stop());
      }
      await Promise.allSettled(operations);
    },
  };
}
