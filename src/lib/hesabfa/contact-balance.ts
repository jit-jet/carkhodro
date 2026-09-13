import type { HesabfaContact } from './types';

/** Hesabfa can return Liability as a negative number. Positive net means debt. */
export function contactBalanceRial(
  contact: Pick<HesabfaContact, 'Liability' | 'Credits'> | null,
): number | null {
  const liability = contact?.Liability;
  const credits = contact?.Credits;
  if (
    typeof liability !== 'number' || !Number.isFinite(liability) ||
    typeof credits !== 'number' || !Number.isFinite(credits) || credits < 0
  ) return null;
  return Math.abs(liability) - credits;
}
