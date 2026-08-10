ALTER TABLE "site_settings"
ADD COLUMN "product_watermark_url" TEXT,
ADD COLUMN "product_watermark_position" TEXT NOT NULL DEFAULT 'bottom-right';
                