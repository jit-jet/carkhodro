'use server';

/**
 * Shipping-option mutation Server Actions — admin panel. Split from
 * `actions/navigation.ts` so the client manager can import writes without
 * pulling that file's `use cache` reads into the browser bundle.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export interface ShippingOptionInput {
  method: string;
  label: string;
  description?: string | null;
  /** Cost in Toman (integer). */
  cost: number;
  isActive?: boolean;
}

function normalizeMethod(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '_');
}

function parseCost(cost: number): bigint | null {
  if (!Number.isFinite(cost) || cost < 0 || !Number.isInteger(cost)) return null;
  return BigInt(cost);
}

export async function createShippingOption(
  input: ShippingOptionInput,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('createShippingOption', async () => {
    const method = normalizeMethod(input.method);
    const label = input.label?.trim() ?? '';
    if (!method || !label) {
      return fail('کلید و عنوان روش ارسال الزامی است.');
    }
    const cost = parseCost(input.cost);
    if (cost === null) {
      return fail('هزینه ارسال باید یک عدد صحیح غیرمنفی باشد.');
    }

    const existing = await prisma.shippingOption.findUnique({
      where: { method },
      select: { id: true },
    });
    if (existing) {
      return fail('این کلید قبلاً برای روش ارسال دیگری استفاده شده است.');
    }

    const created = await prisma.shippingOption.create({
      data: {
        method,
        label,
        description: input.description?.trim() || null,
        cost,
        isActive: input.isActive ?? true,
      },
      select: { id: true },
    });
    updateTag(tags.shipping);
    return ok(created);
  });
}

export async function updateShippingOption(
  id: string,
  input: Partial<ShippingOptionInput>,
): Promise<ActionResult<{ id: string }>> {
  return runMutation('updateShippingOption', async () => {
    const data: {
      method?: string;
      label?: string;
      description?: string | null;
      cost?: bigint;
      isActive?: boolean;
    } = {};

    if (input.method !== undefined) {
      const method = normalizeMethod(input.method);
      if (!method) return fail('کلید روش ارسال الزامی است.');
      const clash = await prisma.shippingOption.findFirst({
        where: { method, NOT: { id } },
        select: { id: true },
      });
      if (clash) {
        return fail('این کلید قبلاً برای روش ارسال دیگری استفاده شده است.');
      }
      data.method = method;
    }

    if (input.label !== undefined) {
      const label = input.label.trim();
      if (!label) return fail('عنوان روش ارسال الزامی است.');
      data.label = label;
    }

    if (input.description !== undefined) {
      data.description = input.description?.trim() || null;
    }

    if (input.cost !== undefined) {
      const cost = parseCost(input.cost);
      if (cost === null) {
        return fail('هزینه ارسال باید یک عدد صحیح غیرمنفی باشد.');
      }
      data.cost = cost;
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    const updated = await prisma.shippingOption.update({
      where: { id },
      data,
      select: { id: true },
    });
    updateTag(tags.shipping);
    return ok(updated);
  });
}

export async function deleteShippingOption(id: string): Promise<ActionResult> {
  return runMutation('deleteShippingOption', async () => {
    const orderCount = await prisma.order.count({ where: { shippingOptionId: id } });
    if (orderCount > 0) {
      return fail(
        'این روش ارسال به سفارش‌هایی متصل است و قابل حذف نیست. می‌توانید آن را غیرفعال کنید.',
      );
    }
    await prisma.shippingOption.delete({ where: { id } });
    updateTag(tags.shipping);
    return ok(undefined);
  });
}
