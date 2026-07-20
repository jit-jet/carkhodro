-- AlterTable: replace fixed social URL columns with header promo fields
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "instagram_url",
DROP COLUMN IF EXISTS "telegram_url",
DROP COLUMN IF EXISTS "whatsapp_url",
ADD COLUMN "header_promo_1" TEXT,
ADD COLUMN "header_promo_2" TEXT;

-- CreateTable
CREATE TABLE "social_links" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_links_sort_order_idx" ON "social_links"("sort_order");
