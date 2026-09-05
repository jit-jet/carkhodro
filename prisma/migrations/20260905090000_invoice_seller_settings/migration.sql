-- Store printable-invoice seller/company details in the database instead of
-- keeping them inside the client-side invoice component.
ALTER TABLE "site_settings" ADD COLUMN "invoice_seller" JSONB;

UPDATE "site_settings"
SET "invoice_seller" = '{
  "brandName": "کارخودرو",
  "storeName": "فروشگاه قطعات خودرو شاه گل",
  "website": "WWW.CARKHODRO.IR",
  "websiteUrl": "https://carkhodro.ir",
  "logoUrl": "/logo.png",
  "country": "ایران",
  "province": "خراسان رضوی",
  "city": "مشهد",
  "postalCode": "۹۱۶۵۶۱۸۶۹۵",
  "address": "بلوار جمهوری اسلامی ۸، نبش شهید صیادتی ۱۹",
  "phone": "۰۵۱۳۳۴۳۳۳۷۱",
  "categoriesNote": "قطعات موتوری، جلوبندی، برقی، انژکتوری — برندهای ویژن، والئو، آیسین، اپتی‌بلت، WAX، امیرنیا، پاورگریپ، تیتیک، فران‌تک، قائم، رینگ مارموت، رینگ ماشین‌کاران، تری‌پارت، کمک KDS و کوشاران، کمک ایران، فنر لول زمان و … SM، موتوپاور، هانتر، شرق",
  "trustNote": "فاکتور تا تسویه کامل نزد خریدار امانت می‌باشد. لطفاً وجه فاکتور را به شماره زیر واریز نمایید.",
  "bankName": "مهر ایران",
  "bankAccountHolder": "حسین شاه گل زاده",
  "cardNumber": "۶۰۶۳۷۳۱۲۱۱۲۳۸۷۷۰",
  "sheba": "IR۰۹۰۶۰۰۳۶۱۹۷۰۰۱۷۹۸۵۶۶۷۰۰۱"
}'::jsonb
WHERE "invoice_seller" IS NULL;
