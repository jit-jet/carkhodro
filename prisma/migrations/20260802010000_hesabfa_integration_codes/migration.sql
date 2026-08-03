-- Hesabfa two-way sync fields (idempotent for partially-migrated databases).

-- Products: rename legacy accountancy_id → hesabfa_code when still present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'accountancy_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'hesabfa_code'
  ) THEN
    ALTER TABLE "products" RENAME COLUMN "accountancy_id" TO "hesabfa_code";
  END IF;
END $$;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hesabfa_code" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hesabfa_id" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "last_synced_at" TIMESTAMP(3);

DROP INDEX IF EXISTS "products_accountancy_id_key";
DROP INDEX IF EXISTS "products_accountancy_id_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "products_hesabfa_code_key" ON "products"("hesabfa_code");
CREATE INDEX IF NOT EXISTS "products_hesabfa_code_idx" ON "products"("hesabfa_code");
CREATE UNIQUE INDEX IF NOT EXISTS "products_hesabfa_id_key" ON "products"("hesabfa_id");

-- Users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hesabfa_code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hesabfa_id" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hesabfa_synced_at" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "users_hesabfa_code_key" ON "users"("hesabfa_code");
CREATE UNIQUE INDEX IF NOT EXISTS "users_hesabfa_id_key" ON "users"("hesabfa_id");
CREATE INDEX IF NOT EXISTS "users_hesabfa_code_idx" ON "users"("hesabfa_code");

-- Orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "hesabfa_code" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "hesabfa_id" INTEGER;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "hesabfa_synced_at" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "orders_hesabfa_code_key" ON "orders"("hesabfa_code");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_hesabfa_id_key" ON "orders"("hesabfa_id");
CREATE INDEX IF NOT EXISTS "orders_hesabfa_code_idx" ON "orders"("hesabfa_code");
