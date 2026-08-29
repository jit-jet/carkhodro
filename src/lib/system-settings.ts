import 'server-only';

import { prisma } from '@/src/lib/prisma';
import {
  decryptSystemConfig,
  EMPTY_SYSTEM_CONFIG,
  encryptSystemConfig,
  type SystemConfig,
} from '@/src/lib/system-settings-crypto';

export { EMPTY_SYSTEM_CONFIG, type SystemConfig } from '@/src/lib/system-settings-crypto';

export type SystemConfigPatch = Partial<Record<keyof SystemConfig, string | null>>;

const SYSTEM_CONFIG_KEYS = [
  'smsApiBaseUrl', 'smsApiKey', 'smsLineNumber', 'smsOtpPatternCode',
  'smsOtpPatternAttr', 'hesabfaApiUrl', 'hesabfaApiKey', 'hesabfaLoginToken',
  'hesabfaBankCode', 'hesabfaPurchaseContactCode',
  'zibalMerchant',
] as const satisfies readonly (keyof SystemConfig)[];

/** Never call this from a render path that can serialize its result to a client. */
export async function getSystemConfig(): Promise<SystemConfig> {
  const row = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  return row ? decryptSystemConfig(row.encryptedConfig) : { ...EMPTY_SYSTEM_CONFIG };
}

export async function updateSystemConfig(
  patch: SystemConfigPatch,
  updatedById: string,
): Promise<void> {
  const current = await getSystemConfig();
  const next = { ...current };
  for (const key of SYSTEM_CONFIG_KEYS) {
    const value = patch[key];
    if (value !== undefined) {
      if (value !== null && typeof value !== 'string') {
        throw new Error('Invalid system-settings value.');
      }
      next[key] = value?.trim() ?? '';
    }
  }
  const encryptedConfig = encryptSystemConfig(next);
  await prisma.systemSetting.upsert({
    where: { id: 1 },
    create: { id: 1, encryptedConfig, updatedById },
    update: { encryptedConfig, updatedById },
  });
}

export function systemConfigStatus(config: SystemConfig) {
  return {
    sms: Boolean(config.smsApiKey && config.smsLineNumber && config.smsOtpPatternCode),
    hesabfa: Boolean(config.hesabfaApiKey && config.hesabfaLoginToken),
    zibal: Boolean(config.zibalMerchant),
  };
}
