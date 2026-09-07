/**
 * Orchestrates full manual sync and webhook handling for Hesabfa.
 */

import { after } from 'next/server';
import {
  fullSyncCategories,
  type CategorySyncStats,
} from './categories';
import {
  deactivateUsersByHesabfaIds,
  fullSyncContacts,
  syncContactsByIds,
  type ContactSyncStats,
} from './contacts';
import { getInvoicesById, isHesabfaConfigured } from './client';
import { syncInvoicesFromHesabfa, type InvoiceSyncStats } from './invoices';
import {
  deleteProductsByHesabfaIds,
  fullSyncProducts,
  syncProductsByIds,
  type ProductSyncStats,
} from './products';
import {
  refreshAllLocalStockFromHesabfa,
  refreshLocalStockFromHesabfaCodes,
} from './stock';
import { type HesabfaWebhookPayload } from './types';
import { classifyHesabfaWebhookAction } from './webhook-actions';
import { itemCodesFromInvoices } from './invoice-stock';

export interface FullSyncSummary {
  categories: CategorySyncStats;
  products: ProductSyncStats;
  contacts: ContactSyncStats;
  stockUpdated: number;
}

/** Run a full sync (pull categories/products/contacts). */
export async function fullSyncHesabfa(): Promise<FullSyncSummary> {
  if (!(await isHesabfaConfigured())) {
    throw new Error('حسابفا پیکربندی نشده است.');
  }

  const categories = await fullSyncCategories();
  const products = await fullSyncProducts();
  // Re-read every quantity from Hesabfa's dedicated inventory endpoint after
  // product upserts so a full sync verifies stock as well as item metadata.
  const stockUpdated = await refreshAllLocalStockFromHesabfa();
  const contacts = await fullSyncContacts();

  return {
    categories,
    products,
    contacts,
    stockUpdated,
  };
}

/** Handle a Hesabfa change-hook payload. */
export async function handleHesabfaWebhook(
  payload: HesabfaWebhookPayload,
): Promise<Record<string, unknown>> {
  const ids = [
    ...new Set(
      (payload.ObjectIdList ?? [])
        .map(Number)
        .filter((n) => Number.isFinite(n)),
    ),
  ];

  const objectType = payload.ObjectType;
  const action = Number(payload.Action);
  const actionKind = classifyHesabfaWebhookAction(objectType, action);

  if (objectType === 'Product') {
    if (actionKind === 'delete') {
      const deleted = await deleteProductsByHesabfaIds(ids);
      if (deleted === ids.length) return { objectType, deleted };

      // Legacy rows may not have a Hesabfa numeric ID. Reconcile against the
      // complete live code list only when an incoming deleted ID was unmatched.
      const stats = await fullSyncProducts();
      return {
        objectType,
        ...stats,
        deleted: deleted + stats.deleted,
        reconciled: true,
      };
    }
    if (actionKind !== 'upsert') return { objectType, action, ignored: true };
    // Product sync also pulls categories (Hesabfa has no Category ObjectType).
    const stats = await syncProductsByIds(ids);
    return { objectType, ...stats };
  }

  if (objectType === 'Contact') {
    if (actionKind === 'delete') {
      const deactivated = await deactivateUsersByHesabfaIds(ids);
      return { objectType, deactivated };
    }
    if (actionKind !== 'upsert') return { objectType, action, ignored: true };
    // Pull contact from Hesabfa and apply name/phone/shop/address/active to the site user.
    const stats = await syncContactsByIds(ids);
    return { objectType, ...stats };
  }

  if (objectType === 'Invoice') {
    if (actionKind === 'delete') {
      // Deleted invoices cannot be fetched to discover their former lines.
      // Pull all current item stocks so manual invoice deletions are reflected.
      const stockUpdated = await refreshAllLocalStockFromHesabfa();
      return {
        objectType,
        updated: 0,
        skipped: ids.length,
        stockUpdated,
        stockItemCodes: 0,
      };
    }
    if (actionKind !== 'upsert') return { objectType, action, ignored: true };

    const invoices = await getInvoicesById(ids);
    const stats: InvoiceSyncStats = await syncInvoicesFromHesabfa(invoices);
    const returnedIds = new Set(
      invoices
        .map((invoice) => invoice.Id)
        .filter((id): id is number => typeof id === 'number'),
    );
    stats.skipped += ids.filter((id) => !returnedIds.has(id)).length;

    // Hook IDs are invoice IDs. Read the invoices, extract their item codes,
    // then pull each item's authoritative Stock value from Hesabfa.
    const itemCodes = itemCodesFromInvoices(invoices);
    const stockUpdated = await refreshLocalStockFromHesabfaCodes(itemCodes);

    return { objectType, ...stats, stockUpdated, stockItemCodes: itemCodes.length };
  }

  return { objectType, ignored: true };
}

/** Run after the response while keeping the Next.js request alive. */
export function runHesabfaBackground(label: string, fn: () => Promise<void>): void {
  after(async () => {
    try {
      if (!(await isHesabfaConfigured())) return;
      await fn();
    } catch (err) {
      console.error(`[hesabfa:${label}]`, err);
    }
  });
}
