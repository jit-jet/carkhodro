/**
 * Orchestrates full manual sync and webhook handling for Hesabfa.
 */

import {
  fullSyncCategories,
  type CategorySyncStats,
} from './categories';
import {
  deactivateUsersByHesabfaIds,
  fullSyncContacts,
  syncContactsFromWebhook,
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
  refreshLocalStockFromHesabfaIds,
} from './stock';
import {
  type HesabfaInvoice,
  type HesabfaWebhookPayload,
} from './types';
import { classifyHesabfaWebhookAction } from './webhook-actions';

export interface FullSyncSummary {
  categories: CategorySyncStats;
  products: ProductSyncStats;
  contacts: ContactSyncStats;
}

/** Parse item/contact codes from Hesabfa webhook Extra (comma / space separated). */
function codesFromExtra(extra: string | null | undefined): string[] {
  if (!extra?.trim()) return [];
  return extra
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function itemCodesFromInvoices(invoices: HesabfaInvoice[]): string[] {
  const codes = invoices.flatMap((invoice) =>
    (invoice.InvoiceItems ?? []).map((line) => {
      const code = line.ItemCode ?? line.Item?.Code;
      return code != null ? String(code).trim() : '';
    }),
  );
  return [...new Set(codes.filter(Boolean))];
}

/** Run a full sync (pull categories/products/contacts). */
export async function fullSyncHesabfa(): Promise<FullSyncSummary> {
  if (!(await isHesabfaConfigured())) {
    throw new Error('حسابفا پیکربندی نشده است.');
  }

  const categories = await fullSyncCategories();
  const products = await fullSyncProducts();
  const contacts = await fullSyncContacts();

  return {
    categories,
    products,
    contacts,
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
  const extraCodes = codesFromExtra(payload.Extra);

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
    const stats = await syncContactsFromWebhook(ids, extraCodes);
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
    const itemCodes = [
      ...new Set([...itemCodesFromInvoices(invoices), ...extraCodes]),
    ];
    const stockUpdated = await refreshLocalStockFromHesabfaCodes(itemCodes);

    return { objectType, ...stats, stockUpdated, stockItemCodes: itemCodes.length };
  }

  // Warehouse receipts affect inventory — refresh linked products when possible.
  if (objectType === 'WarehouseReceipt' || objectType === 'Receipt') {
    const stockUpdated = await refreshLocalStockFromHesabfaIds(ids);
    return { objectType, stockUpdated };
  }

  return { objectType, ignored: true };
}

/** Fire-and-forget wrapper so Hesabfa never breaks checkout/admin flows. */
export function runHesabfaBackground(label: string, fn: () => Promise<void>): void {
  void (async () => {
    if (!(await isHesabfaConfigured())) return;
    await fn();
  })().catch((err) => {
    console.error(`[hesabfa:${label}]`, err);
  });
}
