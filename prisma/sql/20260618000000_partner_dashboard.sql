-- ─────────────────────────────────────────────────────────────────────────────
-- Partner / wholesaler dashboard — additive schema changes.
--
-- This database has NO Prisma migration history, so schema changes are applied
-- as raw SQL with `prisma db execute` (NOT `migrate deploy`). This script is
-- idempotent — safe to run more than once — and matches Prisma's own DDL naming
-- so a follow-up `prisma db push` reports the schema already in sync.
--
--   npx prisma db execute --file prisma/sql/20260618000000_partner_dashboard.sql
--   npx prisma generate
--
-- Covers: the expanded OrderStatus lifecycle, two new enums, partner profile +
-- ledger columns on users, partner settlement terms on orders, and four new
-- tables (support_messages, order_surveys, price_list_requests, backorders).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── OrderStatus: replace the retail lifecycle with the wholesale one ──────────
-- Only runs while the legacy values are still present, mapping each old order to
-- its closest new state. Wrapped in a single statement-block so the type swap is
-- atomic.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'OrderStatus' AND e.enumlabel = 'PENDING'
  ) THEN
    ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";

    CREATE TYPE "OrderStatus" AS ENUM (
      'NEW',
      'AWAITING_CONFIRMATION',
      'CONFIRMED_AWAITING_PAYMENT',
      'PAID',
      'SHIPPED',
      'COMPLETED',
      'CANCELLED_BY_CUSTOMER',
      'CANCELLED_BY_MANAGER',
      'ARCHIVED'
    );

    ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus" USING (
      CASE "status"::text
        WHEN 'PENDING'    THEN 'NEW'
        WHEN 'CONFIRMED'  THEN 'CONFIRMED_AWAITING_PAYMENT'
        WHEN 'PROCESSING' THEN 'AWAITING_CONFIRMATION'
        WHEN 'SHIPPED'    THEN 'SHIPPED'
        WHEN 'DELIVERED'  THEN 'COMPLETED'
        WHEN 'CANCELLED'  THEN 'CANCELLED_BY_CUSTOMER'
        WHEN 'REFUNDED'   THEN 'ARCHIVED'
        ELSE 'NEW'
      END::"OrderStatus"
    );
    ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'NEW';

    DROP TYPE "OrderStatus_old";
  END IF;
END $$;

-- ── New enums (no CREATE TYPE IF NOT EXISTS — guard each one) ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageDirection') THEN
    CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BackorderStatus') THEN
    CREATE TYPE "BackorderStatus" AS ENUM ('PENDING', 'NOTIFIED', 'FULFILLED', 'CANCELLED');
  END IF;
END $$;

-- ── users: partner profile + ledger columns ─────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_balance" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by"     TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "activity_field"  TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "partner_code"    TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_partner_code_key" ON "users" ("partner_code");

-- ── orders: partner settlement terms ────────────────────────────────────────
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_terms" TEXT;

-- ── order_items: per-line discount (gross price stays in price_at_purchase) ──
ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "discount_pct" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- ── orders.order_number — sequential, human-facing invoice number ────────────
-- Modelled as Prisma's @default(autoincrement()): an owned sequence backing an
-- INTEGER column. Existing rows are backfilled, then the sequence is advanced
-- past them so new invoices keep climbing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS "orders_order_number_seq";
    ALTER TABLE "orders"
      ADD COLUMN "order_number" INTEGER NOT NULL DEFAULT nextval('orders_order_number_seq');
    ALTER SEQUENCE "orders_order_number_seq" OWNED BY "orders"."order_number";
    PERFORM setval('orders_order_number_seq', 405000000 + (SELECT count(*) FROM "orders"), true);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_number_key" ON "orders" ("order_number");

-- ── support_messages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "support_messages" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "direction"  "MessageDirection" NOT NULL,
  "subject"    TEXT NOT NULL,
  "body"       TEXT NOT NULL,
  "is_read"    BOOLEAN NOT NULL DEFAULT false,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_messages_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "support_messages_user_id_direction_is_deleted_idx"
  ON "support_messages" ("user_id", "direction", "is_deleted");

-- ── order_surveys ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "order_surveys" (
  "id"              TEXT NOT NULL,
  "order_id"        TEXT NOT NULL,
  "user_id"         TEXT NOT NULL,
  "rating"          INTEGER NOT NULL,
  "positive_points" TEXT[],
  "negative_points" TEXT[],
  "note"            TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_surveys_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_surveys_order_id_fkey" FOREIGN KEY ("order_id")
    REFERENCES "orders" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "order_surveys_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "order_surveys_order_id_key" ON "order_surveys" ("order_id");
CREATE INDEX IF NOT EXISTS "order_surveys_user_id_idx" ON "order_surveys" ("user_id");

-- ── price_list_requests ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "price_list_requests" (
  "id"              TEXT NOT NULL,
  "user_id"         TEXT NOT NULL,
  "titles"          TEXT[],
  "parts_brand_ids" INTEGER[],
  "car_model_ids"   INTEGER[],
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "price_list_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "price_list_requests_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "price_list_requests_user_id_idx" ON "price_list_requests" ("user_id");

-- ── backorders ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "backorders" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "quantity"   INTEGER NOT NULL DEFAULT 1,
  "status"     "BackorderStatus" NOT NULL DEFAULT 'PENDING',
  "note"       TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "backorders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "backorders_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "backorders_product_id_fkey" FOREIGN KEY ("product_id")
    REFERENCES "products" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "backorders_user_id_idx" ON "backorders" ("user_id");
CREATE INDEX IF NOT EXISTS "backorders_product_id_idx" ON "backorders" ("product_id");
