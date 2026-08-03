/**
 * Rules content read — storefront /rules page.
 * Mutations live in `actions/admin-rules.ts`.
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { safeQuery } from '@/src/lib/result';
import {
  DEFAULT_RULES_CONTENT,
  toRulesContentVM,
  type RulesContentVM as RulesContentData,
} from '@/src/lib/rules-defaults';
import { tags } from '@/actions/cache-tags';

export type RulesContentVM = RulesContentData;

export async function getPublicRulesContent(): Promise<RulesContentVM> {
  'use cache';
  cacheLife('days');
  cacheTag(tags.rulesContent);

  return safeQuery(
    'getPublicRulesContent',
    async () => {
      const row = await prisma.rulesContent.findUnique({ where: { id: 1 } });
      return toRulesContentVM(row);
    },
    { ...DEFAULT_RULES_CONTENT },
  );
}
