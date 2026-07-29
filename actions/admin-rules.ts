'use server';

/**
 * Rules content Server Actions — admin read/write for the /rules page.
 * Storefront reads use `actions/rules.ts` (cached).
 */

import { updateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ok, fail, safeQuery, runMutation, type ActionResult } from '@/src/lib/result';
import {
  DEFAULT_RULES_CONTENT,
  toRulesContentVM,
  type RulesContentVM as RulesContentData,
} from '@/src/lib/rules-defaults';
import { tags } from '@/actions/cache-tags';

export type RulesContentVM = RulesContentData;

export async function getRulesContent(): Promise<RulesContentVM> {
  return safeQuery(
    'getRulesContent',
    async () => {
      const row = await prisma.rulesContent.findUnique({ where: { id: 1 } });
      return toRulesContentVM(row);
    },
    { ...DEFAULT_RULES_CONTENT },
  );
}

export async function updateRulesContent(
  input: Partial<RulesContentVM>,
): Promise<ActionResult> {
  return runMutation('updateRulesContent', async () => {
    const body = input.body?.trim() ?? '';
    if (!body) {
      return fail('متن قوانین نمی‌تواند خالی باشد.');
    }

    const data = {
      updatedLabel: input.updatedLabel?.trim() || null,
      intro: input.intro?.trim() || null,
      body,
    };

    await prisma.rulesContent.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    updateTag(tags.rulesContent);
    return ok(undefined);
  });
}
