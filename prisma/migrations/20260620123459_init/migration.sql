/*
  Warnings:

  - The values [PENDING,CONFIRMED,PROCESSING,DELIVERED,CANCELLED,REFUNDED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[order_number]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[partner_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "BackorderStatus" AS ENUM ('PENDING', 'NOTIFIED', 'FULFILLED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('NEW', 'AWAITING_CONFIRMATION', 'CONFIRMED_AWAITING_PAYMENT', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_MANAGER', 'ARCHIVED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "discount_pct" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "order_number" SERIAL NOT NULL,
ADD COLUMN     "payment_terms" TEXT,
ALTER COLUMN "status" SET DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_balance" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "activity_field" TEXT,
ADD COLUMN     "partner_code" TEXT,
ADD COLUMN     "referred_by" TEXT;

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_surveys" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "positive_points" TEXT[],
    "negative_points" TEXT[],
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "titles" TEXT[],
    "parts_brand_ids" INTEGER[],
    "car_model_ids" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_list_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backorders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "BackorderStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backorders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_messages_user_id_direction_is_deleted_idx" ON "support_messages"("user_id", "direction", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "order_surveys_order_id_key" ON "order_surveys"("order_id");

-- CreateIndex
CREATE INDEX "order_surveys_user_id_idx" ON "order_surveys"("user_id");

-- CreateIndex
CREATE INDEX "price_list_requests_user_id_idx" ON "price_list_requests"("user_id");

-- CreateIndex
CREATE INDEX "backorders_user_id_idx" ON "backorders"("user_id");

-- CreateIndex
CREATE INDEX "backorders_product_id_idx" ON "backorders"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_partner_code_key" ON "users"("partner_code");

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_surveys" ADD CONSTRAINT "order_surveys_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_surveys" ADD CONSTRAINT "order_surveys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_requests" ADD CONSTRAINT "price_list_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backorders" ADD CONSTRAINT "backorders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backorders" ADD CONSTRAINT "backorders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
