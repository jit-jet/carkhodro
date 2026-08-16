export interface HesabfaProductIdentity {
  code: string;
  hesabfaId: number | undefined;
}

export interface LocalProductIdentity {
  id: string;
  sku: string;
  hesabfaCode: string | null;
  hesabfaId: number | null;
}

export interface HesabfaIdRelease {
  productId: string;
  hesabfaId: number;
}

/**
 * Match incoming items to local products and identify stale numeric links.
 *
 * Hesabfa item codes are the public/stable identity used throughout the shop.
 * Numeric IDs can be recycled after an item is deleted. When the current code
 * and numeric ID point at different local rows, the code owner remains
 * canonical and the stale numeric link must be released before the update.
 */
export function planProductIdentitySync<T extends HesabfaProductIdentity>(
  items: readonly T[],
  rows: readonly LocalProductIdentity[],
): {
  toUpdate: Array<{ id: string; item: T }>;
  toCreate: T[];
  hesabfaIdsToRelease: HesabfaIdRelease[];
  skipped: number;
} {
  const byCode = new Map<string, LocalProductIdentity>();
  const byHesabfaId = new Map<number, LocalProductIdentity>();
  const bySku = new Map<string, LocalProductIdentity>();

  for (const row of rows) {
    if (row.hesabfaCode) byCode.set(row.hesabfaCode.trim(), row);
    if (row.hesabfaId != null) byHesabfaId.set(row.hesabfaId, row);
    bySku.set(row.sku.trim(), row);
  }

  const toUpdate: Array<{ id: string; item: T }> = [];
  const toCreate: T[] = [];
  const releases = new Map<number, HesabfaIdRelease>();
  const claimedLocalIds = new Set<string>();
  const claimedIncomingIds = new Set<number>();
  let skipped = 0;

  for (const item of items) {
    if (item.hesabfaId != null) {
      if (claimedIncomingIds.has(item.hesabfaId)) {
        skipped++;
        continue;
      }
      claimedIncomingIds.add(item.hesabfaId);
    }

    const codeMatch = byCode.get(item.code);
    const idMatch = item.hesabfaId != null ? byHesabfaId.get(item.hesabfaId) : undefined;
    const skuMatch = bySku.get(item.code);
    const canonical = codeMatch ?? idMatch ?? skuMatch;

    if (!canonical) {
      toCreate.push(item);
      continue;
    }

    if (claimedLocalIds.has(canonical.id)) {
      skipped++;
      continue;
    }
    claimedLocalIds.add(canonical.id);
    toUpdate.push({ id: canonical.id, item });

    if (item.hesabfaId != null && idMatch && idMatch.id !== canonical.id) {
      releases.set(item.hesabfaId, {
        productId: idMatch.id,
        hesabfaId: item.hesabfaId,
      });
    }
  }

  return {
    toUpdate,
    toCreate,
    hesabfaIdsToRelease: [...releases.values()],
    skipped,
  };
}
