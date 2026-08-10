CREATE TABLE IF NOT EXISTS "static_page_seo" (
  "path" TEXT PRIMARY KEY,
  "meta_title" TEXT,
  "meta_description" TEXT,
  "og_image_url" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL
);
