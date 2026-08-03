-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "call_for_price_retail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "call_for_price_wholesale" BOOLEAN NOT NULL DEFAULT false;
