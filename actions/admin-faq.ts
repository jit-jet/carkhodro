'use server';

/**
 * FAQ mutation Server Actions — admin panel. Split out of `actions/faq.ts`
 * so `FaqManager` (a Client Component) can import writes without pulling that
 * file's `use cache` read into the browser bundle.
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, runMutation, type ActionResult } from '@/src/lib/result';
import { tags } from '@/actions/cache-tags';

export interface FaqInput {
  question: string;
  answer: string;
  sortOrder?: number;
}

export async function createFaq(input: FaqInput): Promise<ActionResult<{ id: number }>> {
  return runMutation('createFaq', async () => {
    if (!input.question?.trim() || !input.answer?.trim()) {
      return fail('سوال و پاسخ الزامی است.');
    }
    const created = await prisma.faq.create({
      data: {
        question: input.question.trim(),
        answer: input.answer.trim(),
        sortOrder: input.sortOrder ?? 0,
      },
      select: { id: true },
    });
    updateTag(tags.faqs);
    return ok(created);
  });
}

export async function updateFaq(
  id: number,
  input: Partial<FaqInput>,
): Promise<ActionResult<{ id: number }>> {
  return runMutation('updateFaq', async () => {
    const updated = await prisma.faq.update({
      where: { id },
      data: {
        ...(input.question !== undefined ? { question: input.question.trim() } : {}),
        ...(input.answer !== undefined ? { answer: input.answer.trim() } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
      select: { id: true },
    });
    updateTag(tags.faqs);
    return ok(updated);
  });
}

export async function deleteFaq(id: number): Promise<ActionResult> {
  return runMutation('deleteFaq', async () => {
    await prisma.faq.delete({ where: { id } });
    updateTag(tags.faqs);
    return ok(undefined);
  });
}
