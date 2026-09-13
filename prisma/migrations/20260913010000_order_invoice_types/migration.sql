CREATE TYPE "OrderSource" AS ENUM ('ONLINE', 'OFFLINE');

ALTER TABLE "orders"
  ADD COLUMN "source" "OrderSource" NOT NULL DEFAULT 'ONLINE',
  ADD COLUMN "invoice_type" INTEGER NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS "orders_hesabfa_code_key";
CREATE UNIQUE INDEX "orders_hesabfa_code_invoice_type_key"
  ON "orders"("hesabfa_code", "invoice_type");
