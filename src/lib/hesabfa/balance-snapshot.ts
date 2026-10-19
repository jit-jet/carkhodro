import { contactBalanceRial } from './contact-balance';
import type { HesabfaContact } from './types';

/** Fail registration rather than persist a fabricated zero or a missing balance. */
export async function captureAccountBalanceSnapshotRial(
  user: { role: string; hesabfaCode: string | null },
  getContact: (code: string) => Promise<HesabfaContact | null>,
): Promise<bigint> {
  if (user.role !== 'WHOLESALE') return BigInt(0);
  if (!user.hesabfaCode) throw new Error('Cannot snapshot balance: missing Hesabfa contact');
  const balance = contactBalanceRial(await getContact(user.hesabfaCode));
  if (balance === null || !Number.isSafeInteger(balance)) {
    throw new Error('Cannot snapshot balance: invalid or unavailable Hesabfa balance');
  }
  return BigInt(balance);
}
