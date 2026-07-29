-- CreateEnum
CREATE TYPE "DiscountTargetUserType" AS ENUM ('RETAIL', 'WHOLESALE', 'BOTH');

-- AlterTable
ALTER TABLE "discount_codes" ADD COLUMN "target_user_type" "DiscountTargetUserType" NOT NULL DEFAULT 'BOTH';
