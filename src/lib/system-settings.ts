import 'server-only';

import crypto from 'node:crypto';
import { prisma } from '@/src/lib/prisma';

export interface SystemConfig {
  smsApiBaseUrl: string;
  smsApiKey: string;
  smsLineNumber: string;
  smsOtpPatternCode: string;
  smsOtpPatternAttr: string;
  hesabfaApiUrl: string;
  hesabfaApiKey: string;
  hesabfaLoginToken: string;
  hesabfaHookPassword: string;
  hesabfaBankCode: string;
  hesabfaPurchaseContactCode: string;
  zibalMerchant: string;
}

export type SystemConfigPatch = Partial<Record<keyof SystemConfig, string | null>>;

const SYSTEM_CONFIG_KEYS = [
  'smsApiBaseUrl', 'smsApiKey', 'smsLineNumber', 'smsOtpPatternCode',
  'smsOtpPatternAttr', 'hesabfaApiUrl', 'hesabfaApiKey', 'hesabfaLoginToken',
  'hesabfaHookPassword', 'hesabfaBankCode', 'hesabfaPurchaseContactCode',
  'zibalMerchant',
] as const satisfies readonly (keyof SystemConfig)[];

export const EMPTY_SYSTEM_CONFIG: Readonly<SystemConfig> = Object.freeze({
  smsApiBaseUrl: 'https://api.iranpayamak.com',
  smsApiKey: '',
  smsLineNumber: '',
  smsOtpPatternCode: '',
  smsOtpPatternAttr: 'code',
  hesabfaApiUrl: 'https://api.hesabfa.com/v1',
  hesabfaApiKey: '',
  hesabfaLoginToken: '',
  hesabfaHookPassword: '',
  hesabfaBankCode: '',
  hesabfaPurchaseContactCode: '',
  zibalMerchant: '',
});

interface Envelope {
  v: 1;
  iv: string;
  tag: string;
  data: string;
}

function encryptionKey(): Buffer {
  const encoded = process.env.SYSTEM_SETTINGS_ENCRYPTION_KEY?.trim();
  if (!encoded) throw new Error('SYSTEM_SETTINGS_ENCRYPTION_KEY is required.');
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) {
    throw new Error('SYSTEM_SETTINGS_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  }
  return key;
}

function encrypt(config: SystemConfig): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(config), 'utf8'),
    cipher.final(),
  ]);
  const envelope: Envelope = {
    v: 1,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
  };
  return JSON.stringify(envelope);
}

function decrypt(value: string): SystemConfig {
  const envelope = JSON.parse(value) as Envelope;
  if (envelope.v !== 1) throw new Error('Unsupported system-settings encryption version.');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(envelope.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const clear = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  return { ...EMPTY_SYSTEM_CONFIG, ...(JSON.parse(clear) as Partial<SystemConfig>) };
}

/** Never call this from a render path that can serialize its result to a client. */
export async function getSystemConfig(): Promise<SystemConfig> {
  const row = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  return row ? decrypt(row.encryptedConfig) : { ...EMPTY_SYSTEM_CONFIG };
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
  const encryptedConfig = encrypt(next);
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
    hesabfaWebhook: Boolean(config.hesabfaHookPassword),
    zibal: Boolean(config.zibalMerchant),
  };
}
