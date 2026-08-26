import type { HesabfaInvoice } from './types';

/** Extract unique item codes whose stock may have changed with these invoices. */
export function itemCodesFromInvoices(invoices: HesabfaInvoice[]): string[] {
  const codes = invoices.flatMap((invoice) =>
    (invoice.InvoiceItems ?? []).map((line) => {
      const code = line.ItemCode ?? line.Item?.Code;
      return code != null ? String(code).trim() : '';
    }),
  );
  return [...new Set(codes.filter(Boolean))];
}
