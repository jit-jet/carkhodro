ALTER TABLE "car_models"
  ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
  ADD COLUMN IF NOT EXISTS "meta_description" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description" TEXT;

ALTER TABLE "parts_brands"
  ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
  ADD COLUMN IF NOT EXISTS "meta_description" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description" TEXT;

ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
  ADD COLUMN IF NOT EXISTS "meta_description" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description" TEXT;

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
  ADD COLUMN IF NOT EXISTS "meta_description" TEXT,
  ADD COLUMN IF NOT EXISTS "image_alt" TEXT;

ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "google_analytics_id" TEXT,
  ADD COLUMN IF NOT EXISTS "google_tag_manager_id" TEXT,
  ADD COLUMN IF NOT EXISTS "search_console_verification" TEXT,
  ADD COLUMN IF NOT EXISTS "robots_index" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "robots_follow" BOOLEAN NOT NULL DEFAULT TRUE;

-- Preserve the existing combined analytics setting during the split.
UPDATE "site_settings"
SET "google_tag_manager_id" = "analytics_id"
WHERE "analytics_id" LIKE 'GTM-%' AND "google_tag_manager_id" IS NULL;

UPDATE "site_settings"
SET "google_analytics_id" = "analytics_id"
WHERE "analytics_id" IS NOT NULL AND "analytics_id" NOT LIKE 'GTM-%'
  AND "google_analytics_id" IS NULL;

CREATE TABLE IF NOT EXISTS "seo_redirects" (
  "id" SERIAL PRIMARY KEY,
  "source" TEXT NOT NULL UNIQUE,
  "destination" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
