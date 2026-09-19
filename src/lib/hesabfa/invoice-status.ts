import type { OrderStatus, PaymentStatus, UserRole } from '@/generated/prisma_client';
import type { HesabfaInvoice } from './types';
import { HESABFA_INVOICE_STATUS_APPROVED, HESABFA_INVOICE_STATUS_DRAFT } from './invoice-approval';

export interface InvoiceStatusPatch {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paidAt?: Date | null;
  shippedAt?: Date | null;
}

export function hesabfaApprovalOrderStatus(status: number | undefined): OrderStatus | null {
  if (status === HESABFA_INVOICE_STATUS_DRAFT) return 'AWAITING_CONFIRMATION';
  if (status === HESABFA_INVOICE_STATUS_APPROVED) return 'CONFIRMED_AWAITING_PAYMENT';
  return null;
}

/** Map Hesabfa approval for partners and positive payment/shipping flags for all orders. */
export function mapHesabfaToLocalStatus(
  inv: HesabfaInvoice,
  role?: UserRole,
  currentStatus?: OrderStatus,
): InvoiceStatusPatch {
  const paid = Boolean(inv.Paid && inv.Paid > 0) || (inv.Rest != null && inv.Rest <= 0);
  const sent = inv.Sent === true;
  const patch: InvoiceStatusPatch = {};

  if (role === 'WHOLESALE') {
    const approvalStatus = hesabfaApprovalOrderStatus(inv.Status);
    if (approvalStatus && (!currentStatus || ['NEW', 'AWAITING_CONFIRMATION', 'CONFIRMED_AWAITING_PAYMENT'].includes(currentStatus))) {
      patch.status = approvalStatus;
    }
  }

  if (paid) {
    patch.paymentStatus = 'PAID';
    patch.paidAt = new Date();
    if (!sent && role !== 'WHOLESALE') patch.status = 'PAID';
  }
  if (sent) {
    if (role !== 'WHOLESALE') patch.status = 'SHIPPED';
    patch.shippedAt = new Date();
  }
  return patch;
}
