import { prisma } from '@/src/lib/prisma';

export const STATIC_DEFAULT_IMAGE = '/logo.png';

/** Current admin-managed site logo, used when catalog records have no image. */
export async function getDefaultImageUrl(): Promise<string> {
  const settings = await prisma.siteSetting.findUnique({
    where: { id: 1 },
    select: { logoUrl: true },
  });

  return settings?.logoUrl?.trim() || STATIC_DEFAULT_IMAGE;
}
