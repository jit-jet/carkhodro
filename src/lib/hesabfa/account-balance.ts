import { getContactByCode } from './client';
import { contactBalanceRial } from './contact-balance';
import { captureAccountBalanceSnapshotRial } from './balance-snapshot';

/** Live dashboard balance; amounts are in Rial. */
export async function getAccountBalanceRial(user: {
  role: string;
  hesabfaCode: string | null;
}): Promise<number | null> {
  if (user.role !== 'WHOLESALE') return 0;
  if (!user.hesabfaCode) return null;
  try {
    return contactBalanceRial(await getContactByCode(user.hesabfaCode));
  } catch (error) {
    console.error('[hesabfa:account-balance]', error);
    return null;
  }
}

export async function getAccountBalanceSnapshotRial(user: {
  role: string;
  hesabfaCode: string | null;
}): Promise<bigint> {
  return captureAccountBalanceSnapshotRial(user, getContactByCode);
}
