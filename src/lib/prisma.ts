// Prisma 7 generates the client to a custom output (`generated/prisma_client`,
// see schema.prisma) — import from there, NOT from `@prisma/client`.
import { PrismaClient } from '@/generated/prisma_client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

function createClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

function supportsCurrentSchema(client: PrismaClient | undefined): boolean {
  if (!client) return false
  const delegates = client as unknown as {
    adminActivityLog?: { count?: unknown }
    systemSetting?: { findUnique?: unknown }
  }
  return (
    typeof delegates.adminActivityLog?.count === 'function' &&
    typeof delegates.systemSetting?.findUnique === 'function'
  )
}

const cached = globalForPrisma.prisma
if (cached && !supportsCurrentSchema(cached)) {
  // Prisma's generated shape changed while `next dev` kept the old global
  // singleton alive. Release it before replacing it with the current client.
  void cached.$disconnect()
}

export const prisma = supportsCurrentSchema(cached) ? cached! : createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
