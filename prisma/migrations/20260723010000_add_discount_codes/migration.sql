-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');

-- CreateEnum
CREATE TYPE "DiscountScopeType" AS ENUM ('CATEGORY', 'BRAND', 'PRODUCT');

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(12,2),
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "scope_type" "DiscountScopeType" NOT NULL DEFAULT 'CATEGORY',
    "scope_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "per_customer_limit" INTEGER,
    "total_usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "min_cart_amount" BIGINT,
    "max_discount_amount" BIGINT,
    "first_order_only" BOOLEAN NOT NULL DEFAULT false,
    "min_previous_orders" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_is_active_idx" ON "discount_codes"("is_active");

-- CreateIndex
CREATE INDEX "discount_codes_starts_at_idx" ON "discount_codes"("starts_at");

-- CreateIndex
CREATE INDEX "discount_codes_ends_at_idx" ON "discount_codes"("ends_at");
