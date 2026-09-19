-- Keep existing percentages while changing their meaning to a display-only cash discount.
ALTER TABLE "products" RENAME COLUMN "wholesale_discount_pct" TO "cash_discount_pct";
