'use server';

/**
 * Lightweight product view counter for the storefront PDP.
 * Kept separate from `admin-products` so the public product page does not pull
 * admin/Hesabfa mutation machinery into its import graph.
 */

import { prisma } from '@/src/lib/prisma';
import { ok, runMutation, type ActionResult } from '@/src/lib/result';

/** Fire-and-forget view counter — safe to call without awaiting. */
export async function recordProductView(id: string): Promise<ActionResult> {
  return runMutation('recordProductView', async () => {
    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return ok(undefined);
  });
}
