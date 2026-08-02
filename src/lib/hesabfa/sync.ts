/**
 * Orchestrates full manual sync and webhook handling for Hesabfa.
 */

import {
  deactivateUsersByHesabfaIds,
  fullSyncContacts,
  syncContactsByIds,
  type ContactSyncStats,
} from './contacts';
import { isHesabfaConfigured } from './client';
import { syncInvoicesByIds, type InvoiceSyncStats } from './invoices';
import {
  deleteProductsByHesabfaIds,
  fullSyncProducts,
  syncProductsByIds,
  type ProductSyncStats,
} from './products';
import { HESABFA_ACTION, type HesabfaWebhookPayload } from './types';

export interface FullSyncSummary {
  products: ProductSyncStats;
  contacts: ContactSyncStats;
}

/** Run a full sync (pull products/contacts). */
export async function fullSyncHesabfa(): Promise<FullSyncSummary> {
  if (!isHesabfaConfigured()) {
    throw new Error('حسابفا پیکربندی نشده است.');
  }
console.log('fullSyncHesabfa');
  const products = await fullSyncProducts();
  const contacts = await fullSyncContacts();

  return {
    products,
    contacts,
  };
}

/** Handle a Hesabfa change-hook payload. */
export async function handleHesabfaWebhook(
  payload: HesabfaWebhookPayload,
): Promise<Record<string, unknown>> {
  const ids = (payload.ObjectIdList ?? [])
    .map(Number)
    .filter((n) => Number.isFinite(n));

  const objectType = payload.ObjectType;
  const action = Number(payload.Action);

  if (objectType === 'Product') {
    if (action === HESABFA_ACTION.PRODUCT_DELETE) {
      const deleted = await deleteProductsByHesabfaIds(ids);
      // Refetch remaining ids in case some were updates, not hard deletes.
      const stats = await syncProductsByIds(ids);
      return { objectType, ...stats, deleted: deleted + stats.deleted };
    }
    const stats = await syncProductsByIds(ids);
    return { objectType, ...stats };
  }

  if (objectType === 'Contact') {
    if (action === HESABFA_ACTION.CONTACT_DELETE) {
      const deactivated = await deactivateUsersByHesabfaIds(ids);
      return { objectType, deactivated };
    }
    const stats = await syncContactsByIds(ids);
    return { objectType, ...stats };
  }

  if (objectType === 'Invoice') {
    const stats: InvoiceSyncStats = await syncInvoicesByIds(ids);
    return { objectType, ...stats };
  }

  return { objectType, ignored: true };
}

/** Fire-and-forget wrapper so Hesabfa never breaks checkout/admin flows. */
export function runHesabfaBackground(label: string, fn: () => Promise<void>): void {
  if (!isHesabfaConfigured()) return;
  void fn().catch((err) => {
    console.error(`[hesabfa:${label}]`, err);
  });
}
