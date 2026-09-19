CREATE TABLE "product_visits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_visits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_visits_viewed_at_idx" ON "product_visits"("viewed_at" DESC);
CREATE INDEX "product_visits_user_id_product_id_viewed_at_idx" ON "product_visits"("user_id", "product_id", "viewed_at" DESC);

ALTER TABLE "product_visits" ADD CONSTRAINT "product_visits_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_visits" ADD CONSTRAINT "product_visits_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
