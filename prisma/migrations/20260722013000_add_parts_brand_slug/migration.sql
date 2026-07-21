-- AlterTable
ALTER TABLE "parts_brands" ADD COLUMN "slug" TEXT;

-- Backfill unique URL-safe slugs for existing rows
UPDATE "parts_brands"
SET "slug" = 'brand-' || "id"::text
WHERE "slug" IS NULL OR "slug" = '';

-- Prefer readable slugs for known seed brands (safe if names differ)
UPDATE "parts_brands" SET "slug" = 'bosch' WHERE "name" = 'بوش';
UPDATE "parts_brands" SET "slug" = 'isaco' WHERE "name" = 'ایساکو';
UPDATE "parts_brands" SET "slug" = 'ngk' WHERE "name" = 'NGK';
UPDATE "parts_brands" SET "slug" = 'varian' WHERE "name" = 'واریان';
UPDATE "parts_brands" SET "slug" = 'kian-part' WHERE "name" IN ('کیان‌پارت', 'کیان پارت');
UPDATE "parts_brands" SET "slug" = 'techno' WHERE "name" = 'تکنو';
UPDATE "parts_brands" SET "slug" = 'mapco' WHERE "name" = 'مپکو';
UPDATE "parts_brands" SET "slug" = 'fadak' WHERE "name" = 'فدک';
UPDATE "parts_brands" SET "slug" = 'unknown' WHERE "name" = 'نامشخص';

ALTER TABLE "parts_brands" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "parts_brands_slug_key" ON "parts_brands"("slug");
