import { ZIBAL_GATEWAY_BASE } from './types';
import { getSystemConfig } from '@/src/lib/system-settings';

export interface ZibalConfig {
  merchant: string;
  appUrl: string;
  callbackUrl: string;
  gatewayBase: string;
}

/** Read Zibal merchant + app URL from env. Defaults merchant to `zibal` for sandbox. */
export async function getZibalConfig(): Promise<ZibalConfig> {
  const merchant = (await getSystemConfig()).zibalMerchant.trim();
  if (!merchant) throw new Error('Zibal is not configured.');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is required for Zibal payment callbacks.');
  }
  return {
    merchant,
    appUrl,
    callbackUrl: `${appUrl}/api/payment/zibal/callback`,
    gatewayBase: ZIBAL_GATEWAY_BASE,
  };
}
