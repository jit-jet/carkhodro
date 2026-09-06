'use server';

/** Admin read/write actions for the printable sales-invoice content. */

import { prisma } from '@/src/lib/prisma';
import { Prisma } from '@/generated/prisma_client';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import { fail, ok, runMutation, safeQuery, type ActionResult } from '@/src/lib/result';
import { DEFAULT_INVOICE_CONTENT } from '@/src/lib/invoice-seller-defaults';
import { invoiceContentFromJson } from '@/src/lib/invoice-seller';
import type { InvoiceContent } from '@/src/lib/invoice-seller-types';

export type InvoiceContentVM = InvoiceContent;

export async function getInvoiceContent(): Promise<InvoiceContentVM> {
  return safeQuery(
    'getInvoiceContent',
    async () => {
      const row = await prisma.siteSetting.findUnique({
        where: { id: 1 },
        select: { invoiceSeller: true },
      });
      return invoiceContentFromJson(row?.invoiceSeller);
    },
    { ...DEFAULT_INVOICE_CONTENT },
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function updateInvoiceContent(
  input: Partial<InvoiceContentVM>,
): Promise<ActionResult> {
  return runMutation('updateInvoiceContent', async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('دسترسی غیرمجاز.');

    const content = Object.fromEntries(
      Object.keys(DEFAULT_INVOICE_CONTENT).map((key) => [
        key,
        typeof input[key as keyof InvoiceContentVM] === 'string'
          ? input[key as keyof InvoiceContentVM]!.trim()
          : '',
      ]),
    ) as unknown as InvoiceContentVM;

    const requiredLabels: Array<[keyof InvoiceContentVM, string]> = [
      ['brandName', 'نام برند'],
      ['storeName', 'نام فروشگاه'],
      ['website', 'متن وب‌سایت'],
      ['websiteUrl', 'آدرس وب‌سایت'],
      ['country', 'کشور'],
      ['province', 'استان'],
      ['city', 'شهر'],
      ['postalCode', 'کدپستی'],
      ['address', 'آدرس'],
      ['phone', 'تلفن'],
      ['description', 'توضیحات'],
      ['bankName', 'نام بانک'],
      ['bankAccountHolder', 'نام صاحب حساب'],
      ['cardNumber', 'شماره کارت'],
      ['sheba', 'شماره شبا'],
    ];
    const missing = requiredLabels.find(([key]) => !content[key]);
    if (missing) return fail(`${missing[1]} نمی‌تواند خالی باشد.`);
    if (!isHttpUrl(content.websiteUrl)) {
      return fail('آدرس وب‌سایت باید با http:// یا https:// شروع شود.');
    }

    const invoiceSeller = content as unknown as Prisma.InputJsonValue;
    await prisma.siteSetting.upsert({
      where: { id: 1 },
      create: { id: 1, invoiceSeller },
      update: { invoiceSeller },
    });
    return ok(undefined);
  });
}
