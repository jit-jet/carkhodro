-- CreateEnum
CREATE TYPE "FooterLinkGroup" AS ENUM ('QUICK', 'CATEGORY');

-- CreateTable
CREATE TABLE "footer_links" (
    "id" SERIAL NOT NULL,
    "group" "FooterLinkGroup" NOT NULL,
    "href" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "footer_links_group_sort_order_idx" ON "footer_links"("group", "sort_order");

-- Seed current hardcoded footer columns so the storefront stays populated.
INSERT INTO "footer_links" ("group", "href", "label", "sort_order", "is_active", "updated_at") VALUES
  ('QUICK', '/', 'صفحه اصلی', 0, true, CURRENT_TIMESTAMP),
  ('QUICK', '/products?category=engine', 'قطعات موتوری', 1, true, CURRENT_TIMESTAMP),
  ('QUICK', '/products?category=body', 'بدنه و شیشه', 2, true, CURRENT_TIMESTAMP),
  ('QUICK', '/products?category=electrical', 'برق خودرو', 3, true, CURRENT_TIMESTAMP),
  ('QUICK', '/products', 'لوازم جانبی', 4, true, CURRENT_TIMESTAMP),
  ('QUICK', '/products', 'همه برندها', 5, true, CURRENT_TIMESTAMP),
  ('CATEGORY', '/products?category=engine', 'موتور و قطعات', 0, true, CURRENT_TIMESTAMP),
  ('CATEGORY', '/products?category=brake', 'ترمز و تعلیق', 1, true, CURRENT_TIMESTAMP),
  ('CATEGORY', '/products?category=cooling', 'سیستم خنک‌کننده', 2, true, CURRENT_TIMESTAMP),
  ('CATEGORY', '/products?category=electrical', 'برق و روشنایی', 3, true, CURRENT_TIMESTAMP),
  ('CATEGORY', '/products?category=oil', 'روغن و مایعات', 4, true, CURRENT_TIMESTAMP),
  ('CATEGORY', '/products', 'فیلترها', 5, true, CURRENT_TIMESTAMP);
