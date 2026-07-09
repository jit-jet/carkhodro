import { ZIBAL_GATEWAY_BASE } from './types';

export interface ZibalConfig {
  merchant: string;
  appUrl: string;
  callbackUrl: string;
  gatewayBase: string;
}

/** Read Zibal merchant + app URL from env. Defaults merchant to `zibal` for sandbox. */
export function getZibalConfig(): ZibalConfig {
  const merchant = process.env.ZIBAL_MERCHANT?.trim() || 'zibal';
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
