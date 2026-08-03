-- Convert shipping_options.method from enum to free-form text so admins can
-- create/delete shipping methods beyond STANDARD/EXPRESS.
ALTER TABLE "shipping_options" ALTER COLUMN "method" TYPE TEXT USING ("method"::text);

DROP TYPE "ShippingMethod";
