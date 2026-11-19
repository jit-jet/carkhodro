import type { InvoiceVM } from './dashboard-types';
import { RIAL_PER_TOMAN } from './format';
import {
  HESABFA_INVOICE_STATUS_APPROVED,
  HESABFA_INVOICE_STATUS_DRAFT,
} from './hesabfa/invoice-approval';

export interface InvoiceBalanceInput {
  role: string;
  source: string;
  accountBalanceSnapshotRial: bigint | null;
  totalAmount: bigint;
}

/** Historical invoice figures must never be reconstructed from today's contact balance. */
export function invoiceBalances(
  order: InvoiceBalanceInput,
  accountingStatus: number | undefined,
): Pick<InvoiceVM, 'accountBalanceBeforeInvoiceRial' | 'accountBalanceRial' | 'accountBalanceLabel' | 'accountBalanceNote'> {
  if (order.role === 'RETAIL') {
    return {
      accountBalanceBeforeInvoiceRial: 0,
      accountBalanceRial: 0,
      accountBalanceLabel: 'مانده حساب',
      accountBalanceNote: null,
    };
  }

  const snapshot = order.accountBalanceSnapshotRial;
  if (order.source !== 'ONLINE') {
    // Imported snapshots may already include this invoice and later transactions.
    return {
      accountBalanceBeforeInvoiceRial: null,
      accountBalanceRial: snapshot == null ? null : Number(snapshot),
      accountBalanceLabel: 'مانده حساب هنگام دریافت از حسابفا',
      accountBalanceNote: 'ماندهٔ قبل و بعد از صدور این فاکتور در دسترس نیست؛ این عدد ماندهٔ زمان دریافت فاکتور در سایت است.',
    };
  }

  const approved = accountingStatus === HESABFA_INVOICE_STATUS_APPROVED;
  const draft = accountingStatus === HESABFA_INVOICE_STATUS_DRAFT;
  return {
    accountBalanceBeforeInvoiceRial: snapshot == null ? null : Number(snapshot),
    // The snapshot precedes the accounting write, even after approval. Do not
    // add the invoice to a live balance, which may already contain its effect.
    accountBalanceRial: snapshot == null ? null
      : Number(snapshot + order.totalAmount * BigInt(RIAL_PER_TOMAN)),
    accountBalanceLabel: approved ? 'مانده پس از فاکتور' : 'مانده با احتساب این فاکتور',
    accountBalanceNote: snapshot == null
      ? 'ماندهٔ قبل از صدور این فاکتور ثبت نشده است؛ محاسبهٔ ماندهٔ پس از آن ممکن نیست.'
      : approved
        ? 'فاکتور در حسابداری تأیید شده است. مانده‌های بالا مربوط به زمان ثبت همین فاکتور هستند.'
        : draft
          ? 'این فاکتور هنوز در بدهی حسابداری اعمال نشده است؛ مانده با احتساب فاکتور، محاسباتی است.'
          : 'وضعیت تأیید حسابداری در دسترس نیست؛ مانده با احتساب فاکتور، محاسباتی است.',
  };
}
