import 'server-only';

import { prisma } from '@/src/lib/prisma';
import {
  DEFAULT_INVOICE_CONTENT,
  DEFAULT_INVOICE_SELLER,
} from '@/src/lib/invoice-seller-defaults';
import type { InvoiceContent, InvoiceSeller } from '@/src/lib/invoice-seller-types';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function legacyDescription(row: Record<string, unknown>): string {
  return ['categoriesNote', 'trustNote']
    .map((key) => row[key])
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .map((value) => `<p>${escapeHtml(value.trim())}</p>`)
    .join('');
}

export function invoiceContentFromJson(value: unknown): InvoiceContent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_INVOICE_CONTENT };
  }

  const row = value as Record<string, unknown>;
  const content = Object.fromEntries(
    Object.entries(DEFAULT_INVOICE_CONTENT).map(([key, fallback]) => {
      if (key === 'description') {
        const description = row.description;
        if (typeof description === 'string' && description.trim()) {
          return [key, description.trim()];
        }
        return [key, legacyDescription(row) || fallback];
      }
      const candidate = row[key];
      return [key, typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback];
    }),
  ) as unknown as InvoiceContent;

  return content;
}

/** Read printable-invoice seller/company details from the settings singleton. */
export async function getInvoiceSeller(): Promise<InvoiceSeller> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { id: 1 },
      select: { invoiceSeller: true, logoUrl: true },
    });
    return {
      ...invoiceContentFromJson(row?.invoiceSeller),
      logoUrl: row?.logoUrl?.trim() || DEFAULT_INVOICE_SELLER.logoUrl,
    };
  } catch (error) {
    console.error('[invoice-seller:get]', error);
    return { ...DEFAULT_INVOICE_SELLER };
  }
}
