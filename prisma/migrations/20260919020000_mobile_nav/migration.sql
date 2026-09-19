CREATE TABLE "mobile_nav_items" (
    "id" SERIAL NOT NULL,
    "href" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_nav_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mobile_nav_items_is_active_sort_order_idx" ON "mobile_nav_items"("is_active", "sort_order");
