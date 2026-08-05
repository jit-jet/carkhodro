-- Move static hero copy onto site_settings; keep hero_banners as image slides only.

ALTER TABLE "site_settings"
  ADD COLUMN "hero_title" TEXT,
  ADD COLUMN "hero_description" TEXT,
  ADD COLUMN "hero_button1_text" TEXT,
  ADD COLUMN "hero_button1_href" TEXT,
  ADD COLUMN "hero_button2_text" TEXT,
  ADD COLUMN "hero_button2_href" TEXT;

-- Seed/copy from the first existing hero banner (if any).
UPDATE "site_settings" AS s
SET
  "hero_title" = b."title",
  "hero_description" = b."description",
  "hero_button1_text" = b."button1_text",
  "hero_button1_href" = b."button1_href",
  "hero_button2_text" = b."button2_text",
  "hero_button2_href" = b."button2_href",
  "updated_at" = CURRENT_TIMESTAMP
FROM (
  SELECT *
  FROM "hero_banners"
  ORDER BY "sort_order" ASC, "id" ASC
  LIMIT 1
) AS b
WHERE s."id" = 1;

-- Fallback defaults when no banner / empty settings row exists.
UPDATE "site_settings"
SET
  "hero_title" = COALESCE("hero_title", 'بهترین قیمت قطعات یدکی خودروهای ایرانی و خارجی'),
  "hero_description" = COALESCE(
    "hero_description",
    'بیش از ۵۰,۰۰۰ قطعه اصل و درجه یک با ضمانت اصالت کالا و ارسال سریع به سراسر کشور.'
  ),
  "hero_button1_text" = COALESCE("hero_button1_text", 'مشاهده محصولات'),
  "hero_button1_href" = COALESCE("hero_button1_href", '/products'),
  "hero_button2_text" = COALESCE("hero_button2_text", 'جستجو بر اساس خودرو'),
  "hero_button2_href" = COALESCE("hero_button2_href", '/products'),
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 1;

ALTER TABLE "hero_banners"
  DROP COLUMN "title",
  DROP COLUMN "description",
  DROP COLUMN "button1_text",
  DROP COLUMN "button1_href",
  DROP COLUMN "button2_text",
  DROP COLUMN "button2_href";
