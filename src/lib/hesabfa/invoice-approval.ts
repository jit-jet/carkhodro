import type { UserRole } from '@/generated/prisma_client';

export const HESABFA_INVOICE_STATUS_DRAFT = 0;
export const HESABFA_INVOICE_STATUS_APPROVED = 1;

/** Wholesale dashboard invoices need review in Hesabfa before approval. */
export function hesabfaInvoiceStatusForRole(role: UserRole): number {
  return role === 'WHOLESALE'
    ? HESABFA_INVOICE_STATUS_DRAFT
    : HESABFA_INVOICE_STATUS_APPROVED;
}
