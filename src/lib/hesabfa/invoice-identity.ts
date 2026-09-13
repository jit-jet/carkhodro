export interface HesabfaInvoiceIdentity {
  number: string;
  hesabfaId: number | undefined;
  invoiceType: number | undefined;
}

export interface LocalOrderIdentity {
  id: string;
  hesabfaCode: string | null;
  hesabfaId: number | null;
  invoiceType: number;
}

export interface InvoiceIdRelease {
  orderId: string;
  hesabfaId: number;
}

/**
 * Match by number within type, falling back to the internal id for renumbered
 * invoices. Unmatched invoices are imports. A recycled id is released.
 */
export function planInvoiceIdentitySync<T extends HesabfaInvoiceIdentity>(
  invoices: readonly T[],
  orders: readonly LocalOrderIdentity[],
): {
  matches: Array<{ orderId: string; invoice: T }>;
  toCreate: T[];
  hesabfaIdsToRelease: InvoiceIdRelease[];
  skipped: number;
} {
  const byNumber = new Map<string, LocalOrderIdentity>();
  const byHesabfaId = new Map<number, LocalOrderIdentity>();
  for (const order of orders) {
    if (order.hesabfaCode) byNumber.set(`${order.invoiceType}:${order.hesabfaCode.trim()}`, order);
    if (order.hesabfaId != null) byHesabfaId.set(order.hesabfaId, order);
  }

  const matches: Array<{ orderId: string; invoice: T }> = [];
  const toCreate: T[] = [];
  const releases = new Map<number, InvoiceIdRelease>();
  const claimedOrders = new Set<string>();
  let skipped = 0;

  for (const invoice of invoices) {
    if (!invoice.number || invoice.invoiceType == null || ![0, 1, 2, 3].includes(invoice.invoiceType)) {
      skipped++;
      continue;
    }

    const numberMatch = byNumber.get(`${invoice.invoiceType}:${invoice.number}`);
    const idMatch =
      invoice.hesabfaId != null ? byHesabfaId.get(invoice.hesabfaId) : undefined;
    const canonical = numberMatch ?? (idMatch?.invoiceType === invoice.invoiceType ? idMatch : undefined);

    if (!canonical) {
      toCreate.push(invoice);
      if (invoice.hesabfaId != null && idMatch) releases.set(invoice.hesabfaId, {
        orderId: idMatch.id, hesabfaId: invoice.hesabfaId,
      });
      continue;
    }
    if (claimedOrders.has(canonical.id)) {
      skipped++;
      continue;
    }

    claimedOrders.add(canonical.id);
    matches.push({ orderId: canonical.id, invoice });

    if (invoice.hesabfaId != null && idMatch && idMatch.id !== canonical.id) {
      releases.set(invoice.hesabfaId, {
        orderId: idMatch.id,
        hesabfaId: invoice.hesabfaId,
      });
    }
  }

  return {
    matches,
    toCreate,
    hesabfaIdsToRelease: [...releases.values()],
    skipped,
  };
}
