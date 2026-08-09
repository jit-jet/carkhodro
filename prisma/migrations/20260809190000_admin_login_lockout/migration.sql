ALTER TABLE "users"
ADD COLUMN "failed_admin_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "admin_locked_until" TIMESTAMP(3);
