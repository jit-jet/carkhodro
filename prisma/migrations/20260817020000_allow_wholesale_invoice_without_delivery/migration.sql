-- Wholesale invoices can be registered before an address or shipping method
-- has been agreed. Retail checkout continues to require both in application
-- validation and always writes non-null foreign keys.
ALTER TABLE "orders" ALTER COLUMN "address_id" DROP NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "shipping_option_id" DROP NOT NULL;
