-- CreateEnum
CREATE TYPE "SmsTargetRole" AS ENUM ('RETAIL', 'WHOLESALE', 'ALL');

-- CreateEnum
CREATE TYPE "SmsCampaignStatus" AS ENUM ('PENDING', 'SENT', 'PARTIAL', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_hash" TEXT;

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT,
    "secondary_phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "working_hours" TEXT,
    "instagram_url" TEXT,
    "telegram_url" TEXT,
    "whatsapp_url" TEXT,
    "about_text" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_campaigns" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "target_role" "SmsTargetRole" NOT NULL,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "status" "SmsCampaignStatus" NOT NULL DEFAULT 'PENDING',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "sms_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sms_campaigns_created_at_idx" ON "sms_campaigns"("created_at");

-- AddForeignKey
ALTER TABLE "sms_campaigns" ADD CONSTRAINT "sms_campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
