import type { HesabfaInvoice } from './types';

interface InvoiceFetchers {
  getByIds(ids: number[]): Promise<HesabfaInvoice[]>;
  getByNumber(number: string | number, type: number): Promise<HesabfaInvoice | null>;
}

/** Fetch complete invoices in one request when possible, preserving list order. */
export async function hydrateInvoiceBatch(
  rows: HesabfaInvoice[],
  type: number,
  fetchers: InvoiceFetchers,
): Promise<Array<HesabfaInvoice | null>> {
  const ids = [...new Set(rows.flatMap((row) =>
    typeof row.Id === 'number' && Number.isInteger(row.Id) && row.Id > 0 ? [row.Id] : []))];
  const byId = new Map<number, HesabfaInvoice>();

  if (ids.length > 0) {
    try {
      for (const invoice of await fetchers.getByIds(ids)) {
        if (typeof invoice.Id === 'number') byId.set(invoice.Id, invoice);
      }
    } catch {
      // Older or temporarily failing APIs can still hydrate by invoice number.
    }
  }

  const result: Array<HesabfaInvoice | null> = new Array(rows.length).fill(null);
  const fallbackIndexes: number[] = [];
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!;
    const detail = row.Id != null ? byId.get(row.Id) : undefined;
    if (
      detail &&
      String(detail.Number).trim() === String(row.Number).trim() &&
      (detail.InvoiceType == null || detail.InvoiceType === type) &&
      Array.isArray(detail.InvoiceItems)
    ) {
      result[index] = detail;
    } else {
      fallbackIndexes.push(index);
    }
  }

  const fallback = await Promise.all(fallbackIndexes.map((index) =>
    fetchers.getByNumber(rows[index]!.Number, type)));
  for (let index = 0; index < fallbackIndexes.length; index++) {
    result[fallbackIndexes[index]!] = fallback[index]!;
  }
  return result;
}
