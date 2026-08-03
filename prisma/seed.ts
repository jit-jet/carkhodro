import 'dotenv/config';
import { PrismaClient, UserRole } from '../generated/prisma_client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

async function main() {
  await seedAdminUser();
  await seedShippingOptions();
}

/**
 * Creates the initial `/admin` login — an ADMIN-role `User` with a password
 * hash. Reads credentials from `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD`
 * (see `.env.example`) so no password ever lands in source control. Idempotent:
 * skips if an admin with that username already exists.
 */
async function seedAdminUser() {
  const username = process.env.ADMIN_SEED_USERNAME;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!username || !password) {
    console.warn('  Skipping admin seed — set ADMIN_SEED_USERNAME/ADMIN_SEED_PASSWORD in .env.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`  Admin login already exists for ${username}. Skipping.`);
    return;
  }

  const legacyAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, username: null },
  });
  if (legacyAdmin) {
    await prisma.user.update({
      where: { id: legacyAdmin.id },
      data: { username },
    });
    console.log(`  Admin username set to ${username} for existing admin (/admin/login).`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      // `phoneNumber` is required on User but unused for admin login.
      phoneNumber: '09000000000',
      username,
      firstName: 'مدیر',
      lastName: 'سیستم',
      role: UserRole.ADMIN,
      isVerified: true,
      passwordHash,
    },
  });
  console.log(`  Admin login created for ${username} (/admin/login).`);
}

/**
 * Default retail shipping methods. Wholesale invoice flow looks up STANDARD by
 * code; checkout lists active options. Idempotent upserts by `method`.
 */
async function seedShippingOptions() {
  const defaults = [
    {
      method: 'STANDARD',
      label: 'ارسال عادی',
      description: '۳ تا ۵ روز کاری',
      cost: BigInt(50_000),
      isActive: true,
    },
    {
      method: 'EXPRESS',
      label: 'ارسال سریع',
      description: '۱ تا ۲ روز کاری',
      cost: BigInt(120_000),
      isActive: true,
    },
  ] as const;

  for (const row of defaults) {
    await prisma.shippingOption.upsert({
      where: { method: row.method },
      create: { ...row },
      update: {},
    });
  }
  console.log('  Shipping options seeded (STANDARD, EXPRESS).');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
