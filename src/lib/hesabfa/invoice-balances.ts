import { invoiceBalances, type InvoiceBalanceInput } from '../invoice-balances';
import { getInvoiceByNumber } from './client';

/** Use accounting approval itself; local payment/shipping status is independent. */
export async function getInvoiceBalances(order: InvoiceBalanceInput & {
  hesabfaCode: string | null;
  invoiceType: number;
}) {
  let accountingStatus: number | undefined;
  if (order.role !== 'RETAIL' && order.source === 'ONLINE' && order.hesabfaCode) {
    try {
      const invoice = await getInvoiceByNumber(order.hesabfaCode, order.invoiceType);
      accountingStatus = invoice?.Status;
    } catch (error) {
      console.error('[hesabfa:invoice-balances]', error);
    }
  }
  return invoiceBalances(order, accountingStatus);
}
