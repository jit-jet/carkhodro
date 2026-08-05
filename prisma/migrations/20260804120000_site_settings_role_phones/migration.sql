-- Rename existing shared phones → retail phones (preserve data).
ALTER TABLE "site_settings" RENAME COLUMN "phone" TO "retail_phone_1";
ALTER TABLE "site_settings" RENAME COLUMN "secondary_phone" TO "retail_phone_2";

-- Wholesale contact phones (visible only to logged-in WHOLESALE users).
ALTER TABLE "site_settings" ADD COLUMN "wholesale_phone_1" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "wholesale_phone_2" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "wholesale_phone_3" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "wholesale_phone_4" TEXT;
