import type { HesabfaInvoice } from './types';

const DEFAULT_RETRY_DELAYS_MS = [750, 750, 1_500, 3_000, 5_000] as const;

interface WebhookInvoiceFetchOptions {
  getByIds(ids: number[]): Promise<HesabfaInvoice[]>;
  sleep?: (ms: number) => Promise<void>;
  retryDelaysMs?: readonly number[];
}

function invoiceIds(invoices: readonly HesabfaInvoice[]): Set<number> {
  return new Set(invoices.flatMap((invoice) =>
    typeof invoice.Id === 'number' ? [invoice.Id] : []));
}

/**
 * Hesabfa can deliver a change hook before the changed invoice is visible from
 * invoice/getById. Delay the first read and require a second complete read so a
 * newly-created invoice or its previous edit is not accepted as the final state.
 */
export async function fetchWebhookInvoices(
  ids: readonly number[],
  options: WebhookInvoiceFetchOptions,
): Promise<HesabfaInvoice[]> {
  const wanted = [...new Set(ids)];
  if (wanted.length === 0) return [];

  const sleep = options.sleep ?? ((ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const delays = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  if (delays.length < 2) {
    throw new Error('Webhook invoice fetching requires at least two attempts.');
  }

  let lastError: unknown;
  let lastMissing = wanted;
  for (let attempt = 0; attempt < delays.length; attempt++) {
    await sleep(delays[attempt]!);
    try {
      const invoices = await options.getByIds(wanted);
      const returned = invoiceIds(invoices);
      lastMissing = wanted.filter((id) => !returned.has(id));

      // Even a complete first read may be the state from immediately before an
      // edit. The next read is the stabilization read and is the one we import.
      if (lastMissing.length === 0 && attempt > 0) return invoices;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError && lastMissing.length === wanted.length) throw lastError;
  throw new Error(`Hesabfa invoices were not visible after retry: ${lastMissing.join(',')}`);
}
