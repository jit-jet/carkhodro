import { getZibalConfig } from './config';
import type {
  ZibalRequestPayload,
  ZibalRequestResponse,
  ZibalVerifyPayload,
  ZibalVerifyResponse,
} from './types';

async function zibalPost<T>(path: string, body: unknown): Promise<T> {
  const { gatewayBase } = getZibalConfig();
  const res = await fetch(`${gatewayBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Zibal HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Step 1 — register a payment session and receive a `trackId`. */
export async function zibalRequestPayment(
  input: Omit<ZibalRequestPayload, 'merchant' | 'callbackUrl'>,
): Promise<ZibalRequestResponse> {
  const { merchant, callbackUrl } = getZibalConfig();
  return zibalPost<ZibalRequestResponse>('/v1/request', {
    merchant,
    callbackUrl,
    ...input,
  } satisfies ZibalRequestPayload);
}

/** Step 3 — confirm a successful callback (must be called before closing the session). */
export async function zibalVerifyPayment(trackId: number): Promise<ZibalVerifyResponse> {
  const { merchant } = getZibalConfig();
  return zibalPost<ZibalVerifyResponse>('/v1/verify', {
    merchant,
    trackId,
  } satisfies ZibalVerifyPayload);
}

/** Step 2 — browser redirect URL to open the Zibal payment page. */
export function zibalStartUrl(trackId: number | bigint): string {
  const { gatewayBase } = getZibalConfig();
  return `${gatewayBase}/start/${trackId}`;
}
