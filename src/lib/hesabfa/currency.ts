/**
 * Hesabfa amounts are Rial (IRR). The site stores and displays Toman.
 * 1 Toman = 10 Rial (`RIAL_PER_TOMAN`).
 */

import { RIAL_PER_TOMAN } from '@/src/lib/format';

/** Convert a Hesabfa Rial amount to local Toman (non-negative BigInt). */
export function rialToToman(rial: number | null | undefined): bigint {
  const n = Number(rial ?? 0);
  if (!Number.isFinite(n) || n <= 0) return BigInt(0);
  return BigInt(Math.max(0, Math.round(n / RIAL_PER_TOMAN)));
}

/** Convert a local Toman amount to Hesabfa Rial (non-negative number). */
export function tomanToRial(toman: bigint | number | null | undefined): number {
  const n = typeof toman === 'bigint' ? Number(toman) : Number(toman ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(0, Math.round(n * RIAL_PER_TOMAN));
}
