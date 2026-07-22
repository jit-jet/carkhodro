-- AlterTable: reviews — admin read tracking + public reply
ALTER TABLE "reviews" ADD COLUMN "is_read" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reviews" ADD COLUMN "admin_reply" TEXT;
ALTER TABLE "reviews" ADD COLUMN "replied_at" TIMESTAMP(3);

-- Existing reviews should not flood the new inbox as unread
UPDATE "reviews" SET "is_read" = true;

-- CreateIndex
CREATE INDEX "reviews_is_read_idx" ON "reviews"("is_read");

-- AlterTable: support_messages — admin-side read tracking for partner OUTBOUND
ALTER TABLE "support_messages" ADD COLUMN "admin_is_read" BOOLEAN NOT NULL DEFAULT false;

-- Existing messages should not flood the new inbox as unread
UPDATE "support_messages" SET "admin_is_read" = true;

-- CreateIndex
CREATE INDEX "support_messages_admin_is_read_direction_is_deleted_idx" ON "support_messages"("admin_is_read", "direction", "is_deleted");

-- AlterTable: product_suggestions — admin read tracking
ALTER TABLE "product_suggestions" ADD COLUMN "is_read" BOOLEAN NOT NULL DEFAULT false;

-- Existing suggestions should not flood the new inbox as unread
UPDATE "product_suggestions" SET "is_read" = true;

-- CreateIndex
CREATE INDEX "product_suggestions_is_read_idx" ON "product_suggestions"("is_read");
