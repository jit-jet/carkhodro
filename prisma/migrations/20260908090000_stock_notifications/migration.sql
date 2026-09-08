-- Store one-shot back-in-stock SMS subscriptions.
CREATE TABLE "stock_notifications" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,

    CONSTRAINT "stock_notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_notifications_product_id_phone_number_key"
ON "stock_notifications"("product_id", "phone_number");

CREATE INDEX "stock_notifications_sent_at_processing_at_idx"
ON "stock_notifications"("sent_at", "processing_at");

ALTER TABLE "stock_notifications"
ADD CONSTRAINT "stock_notifications_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
