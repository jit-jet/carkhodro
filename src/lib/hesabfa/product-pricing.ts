import { rialToToman } from './currency';
import type { HesabfaItem } from './types';

/** Hesabfa SellPrice is the authoritative source for local wholesale_price. */
export function wholesaleFromHesabfaItem(item: HesabfaItem): bigint {
  return rialToToman(item.SellPrice);
}
