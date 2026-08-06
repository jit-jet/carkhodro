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
import { isHesabfaConfigured } from './client';
import { prisma } from '@/src/lib/prisma';
import { syncInvoicesByIds, type InvoiceSyncStats } from './invoices';
import {
  deleteProductsByHesabfaIds,
  fullSyncProducts,
  syncProductsByIds,
  type ProductSyncStats,
} from './products';
import { refreshLocalStockFromHesabfaIds } from './stock';
import { HESABFA_ACTION, type HesabfaWebhookPayload } from './types';

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

/** Run a full sync (pull categories/products/contacts). */
export async function fullSyncHesabfa(): Promise<FullSyncSummary> {
  if (!isHesabfaConfigured()) {
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
  const ids = (payload.ObjectIdList ?? [])
    .map(Number)
    .filter((n) => Number.isFinite(n));

  const objectType = payload.ObjectType;
  const action = Number(payload.Action);
  const extraCodes = codesFromExtra(payload.Extra);

  if (objectType === 'Product') {
    if (action === HESABFA_ACTION.PRODUCT_DELETE) {
      const deleted = await deleteProductsByHesabfaIds(ids);
      // Refetch remaining ids in case some were updates, not hard deletes.
      const stats = await syncProductsByIds(ids);
      return { objectType, ...stats, deleted: deleted + stats.deleted };
    }
    // Product sync also pulls categories (Hesabfa has no Category ObjectType).
    const stats = await syncProductsByIds(ids);
    return { objectType, ...stats };
  }

  if (objectType === 'Contact') {
    if (action === HESABFA_ACTION.CONTACT_DELETE) {
      const deactivated = await deactivateUsersByHesabfaIds(ids);
      return { objectType, deactivated };
    }
    // Pull contact from Hesabfa and apply name/phone/shop/address/active to the site user.
    const stats = await syncContactsFromWebhook(ids, extraCodes);
    return { objectType, ...stats };
  }

  if (objectType === 'Invoice') {
    const stats: InvoiceSyncStats = await syncInvoicesByIds(ids);
    // Sales/purchase invoices change stock — re-read item Stock from Hesabfa.
    if (extraCodes.length > 0) {
      const products = await prisma.product.findMany({
        where: { OR: [{ hesabfaCode: { in: extraCodes } }, { sku: { in: extraCodes } }] },
        select: { hesabfaId: true },
      });
      const hesabfaIds = products
        .map((p) => p.hesabfaId)
        .filter((id): id is number => id != null);
      const stockUpdated = await refreshLocalStockFromHesabfaIds(hesabfaIds);
      return { objectType, ...stats, stockUpdated };
    }
    return { objectType, ...stats };
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
  if (!isHesabfaConfigured()) return;
  void fn().catch((err) => {
    console.error(`[hesabfa:${label}]`, err);
  });
}
