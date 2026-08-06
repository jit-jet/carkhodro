-- Branding, default SEO, and analytics fields on the singleton site_settings row.
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "site_name" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "favicon_url" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "apple_touch_icon_url" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "meta_title" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "meta_description" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "og_image_url" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "copyright_text" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "analytics_id" TEXT;
