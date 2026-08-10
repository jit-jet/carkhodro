ALTER TABLE "seo_redirects"
  ADD COLUMN IF NOT EXISTS "status_code" INTEGER NOT NULL DEFAULT 301;

ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_description";
ALTER TABLE "parts_brands" DROP COLUMN IF EXISTS "seo_description";
ALTER TABLE "car_models" DROP COLUMN IF EXISTS "seo_description";
