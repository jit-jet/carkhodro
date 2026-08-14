-- Remove unused profile metadata and its unique index.
DROP INDEX IF EXISTS "users_partner_code_key";

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "referred_by",
  DROP COLUMN IF EXISTS "birth_date",
  DROP COLUMN IF EXISTS "partner_code";
