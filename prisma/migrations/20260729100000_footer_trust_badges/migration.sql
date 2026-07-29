-- AlterTable: add editable footer trust badge slots (icon / title / description × 4)
ALTER TABLE "site_settings"
ADD COLUMN "footer_trust_1_icon" TEXT,
ADD COLUMN "footer_trust_1_title" TEXT,
ADD COLUMN "footer_trust_1_desc" TEXT,
ADD COLUMN "footer_trust_2_icon" TEXT,
ADD COLUMN "footer_trust_2_title" TEXT,
ADD COLUMN "footer_trust_2_desc" TEXT,
ADD COLUMN "footer_trust_3_icon" TEXT,
ADD COLUMN "footer_trust_3_title" TEXT,
ADD COLUMN "footer_trust_3_desc" TEXT,
ADD COLUMN "footer_trust_4_icon" TEXT,
ADD COLUMN "footer_trust_4_title" TEXT,
ADD COLUMN "footer_trust_4_desc" TEXT;
