-- AlterTable
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "is_hidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_is_hidden_idx" ON "reviews"("is_hidden");
