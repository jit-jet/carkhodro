-- Optional product buy/cost price (Hesabfa BuyPrice), stored in Toman.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "buy_price" BIGINT;
