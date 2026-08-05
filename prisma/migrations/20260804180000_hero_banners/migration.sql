-- CreateTable
CREATE TABLE "hero_banners" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "button1_text" TEXT NOT NULL,
    "button1_href" TEXT NOT NULL,
    "button2_text" TEXT,
    "button2_href" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_banners_sort_order_idx" ON "hero_banners"("sort_order");

-- Seed the previous hardcoded homepage hero so the storefront stays populated.
INSERT INTO "hero_banners" (
  "title",
  "description",
  "image_url",
  "button1_text",
  "button1_href",
  "button2_text",
  "button2_href",
  "sort_order",
  "is_active",
  "updated_at"
) VALUES (
  'بهترین قیمت قطعات یدکی خودروهای ایرانی و خارجی',
  'بیش از ۵۰,۰۰۰ قطعه اصل و درجه یک با ضمانت اصالت کالا و ارسال سریع به سراسر کشور.',
  '/tranrse-car.png',
  'مشاهده محصولات',
  '/products',
  'جستجو بر اساس خودرو',
  '/products',
  0,
  true,
  CURRENT_TIMESTAMP
);
