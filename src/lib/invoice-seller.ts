import 'server-only';

import { prisma } from '@/src/lib/prisma';
import { DEFAULT_INVOICE_SELLER } from '@/src/lib/invoice-seller-defaults';
import type { InvoiceSeller } from '@/src/lib/invoice-seller-types';

function invoiceSellerFromJson(value: unknown): InvoiceSeller {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_INVOICE_SELLER };
  }

  const row = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(DEFAULT_INVOICE_SELLER).map(([key, fallback]) => {
      const candidate = row[key];
      return [key, typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback];
    }),
  ) as unknown as InvoiceSeller;
}

/** Read printable-invoice seller/company details from the settings singleton. */
export async function getInvoiceSeller(): Promise<InvoiceSeller> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { id: 1 },
      select: { invoiceSeller: true },
    });
    return invoiceSellerFromJson(row?.invoiceSeller);
  } catch (error) {
    console.error('[invoice-seller:get]', error);
    return { ...DEFAULT_INVOICE_SELLER };
  }
}
