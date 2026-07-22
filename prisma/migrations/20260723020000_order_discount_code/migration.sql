-- AlterTable
ALTER TABLE "orders" ADD COLUMN "discount_amount" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "discount_code" TEXT;
ALTER TABLE "orders" ADD COLUMN "discount_code_id" TEXT;

-- CreateIndex
CREATE INDEX "orders_discount_code_id_idx" ON "orders"("discount_code_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
