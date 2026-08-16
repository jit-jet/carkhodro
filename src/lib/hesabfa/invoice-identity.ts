export interface HesabfaInvoiceIdentity {
  number: string;
  hesabfaId: number | undefined;
  invoiceType: number | undefined;
}

export interface LocalOrderIdentity {
  id: string;
  hesabfaCode: string | null;
  hesabfaId: number | null;
}

export interface InvoiceIdRelease {
  orderId: string;
  hesabfaId: number;
}

/**
 * Resolve Hesabfa sales invoices to existing orders only. This function never
 * produces creates: invoices unknown to the site are counted as skipped.
 */
export function planInvoiceIdentitySync<T extends HesabfaInvoiceIdentity>(
  invoices: readonly T[],
  orders: readonly LocalOrderIdentity[],
): {
  matches: Array<{ orderId: string; invoice: T }>;
  hesabfaIdsToRelease: InvoiceIdRelease[];
  skipped: number;
} {
  const byNumber = new Map<string, LocalOrderIdentity>();
  const byHesabfaId = new Map<number, LocalOrderIdentity>();
  for (const order of orders) {
    if (order.hesabfaCode) byNumber.set(order.hesabfaCode.trim(), order);
    if (order.hesabfaId != null) byHesabfaId.set(order.hesabfaId, order);
  }

  const matches: Array<{ orderId: string; invoice: T }> = [];
  const releases = new Map<number, InvoiceIdRelease>();
  const claimedOrders = new Set<string>();
  let skipped = 0;

  for (const invoice of invoices) {
    // Site orders correspond only to Hesabfa sales invoices (InvoiceType 0).
    if (invoice.invoiceType != null && invoice.invoiceType !== 0) {
      skipped++;
      continue;
    }

    const numberMatch = invoice.number ? byNumber.get(invoice.number) : undefined;
    const idMatch =
      invoice.hesabfaId != null ? byHesabfaId.get(invoice.hesabfaId) : undefined;
    const canonical = numberMatch ?? idMatch;

    if (!canonical || claimedOrders.has(canonical.id)) {
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
    hesabfaIdsToRelease: [...releases.values()],
    skipped,
  };
}
