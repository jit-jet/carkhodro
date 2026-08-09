ALTER TABLE "users"
ADD COLUMN "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- Preserve access for the current back-office administrator(s). New ADMIN
-- accounts remain non-super by default and must be promoted deliberately.
UPDATE "users" SET "is_super_admin" = true WHERE "role" = 'ADMIN';

CREATE TABLE "system_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "encrypted_config" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "system_settings_singleton" CHECK ("id" = 1)
);
