import type { OrderStatus, PaymentStatus } from '@/generated/prisma_client';
import type { HesabfaInvoice } from './types';

export interface InvoiceStatusPatch {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paidAt?: Date | null;
  shippedAt?: Date | null;
}

/** Map the authoritative positive payment/shipping flags from Hesabfa. */
export function mapHesabfaToLocalStatus(inv: HesabfaInvoice): InvoiceStatusPatch {
  const paid = Boolean(inv.Paid && inv.Paid > 0) || (inv.Rest != null && inv.Rest <= 0);
  const sent = inv.Sent === true;
  const patch: InvoiceStatusPatch = {};

  if (paid) {
    patch.paymentStatus = 'PAID';
    patch.paidAt = new Date();
    if (!sent) patch.status = 'PAID';
  }
  if (sent) {
    patch.status = 'SHIPPED';
    patch.shippedAt = new Date();
  }
  return patch;
}
