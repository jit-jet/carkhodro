-- CreateTable
CREATE TABLE "post_categories" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_categories_slug_key" ON "post_categories"("slug");

-- CreateIndex
CREATE INDEX "post_categories_is_active_idx" ON "post_categories"("is_active");

-- CreateIndex
CREATE INDEX "post_categories_sort_order_idx" ON "post_categories"("sort_order");

-- AlterTable
ALTER TABLE "posts"
ADD COLUMN "category_id" INTEGER,
ADD COLUMN "meta_title" TEXT,
ADD COLUMN "meta_description" TEXT,
ADD COLUMN "meta_keywords" TEXT,
ADD COLUMN "og_title" TEXT,
ADD COLUMN "og_description" TEXT,
ADD COLUMN "og_image" TEXT;

-- CreateIndex
CREATE INDEX "posts_category_id_idx" ON "posts"("category_id");

-- AddForeignKey
ALTER TABLE "posts"
ADD CONSTRAINT "posts_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "post_categories"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
