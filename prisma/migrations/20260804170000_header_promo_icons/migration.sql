-- Optional custom icons for header promotional texts (no code defaults).
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "header_promo_1_icon" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "header_promo_2_icon" TEXT;
