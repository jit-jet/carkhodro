-- ─────────────────────────────────────────────────────────────────────────────
-- Typo-tolerant fuzzy full-text search for products (pg_trgm trigram matching).
--
-- Strategy: maintain one denormalized, *normalized* `search_text` document per
-- product (name + sku + origin + parts-brand + category + compatible car models)
-- and query it with pg_trgm's word-similarity operators. Trigram matching is
-- inherently tolerant of misspellings, merged words and irregular spacing; the
-- application layer splits the query into tokens and matches each independently,
-- which adds multi-word / out-of-order support. A GIN(gin_trgm_ops) index keeps
-- lookups fast.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Normalize Persian/Arabic text so the indexed document and the user's query are
-- compared on equal footing. Unifies Arabic vs Persian Yeh/Kaf, folds Arabic and
-- Persian digits to Latin, strips ZWNJ + tatweel (so "فیلتر‌روغن" == "فیلترروغن"),
-- lowercases Latin (SKUs) and collapses runs of whitespace. IMMUTABLE so it can
-- back an expression index and be inlined by the planner.
--
-- NOTE: the JS helper `normalizeQuery()` in actions/search.ts MUST mirror this.
CREATE OR REPLACE FUNCTION fts_normalize(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT btrim(
    regexp_replace(
      translate(
        lower(coalesce(input, '')),
        --     ٠-٩ (Arabic)  ۰-۹ (Persian)  ي ك  ZWNJ tatweel
        '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹يك‌ـ',
        -- digits → 0-9, ي→ی, ك→ک; the trailing ZWNJ + tatweel have no
        -- counterpart in `to`, so translate() drops them.
        '01234567890123456789یک'
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

-- Denormalized search document. DB-maintained only — never written from app code.
ALTER TABLE "products" ADD COLUMN "search_text" TEXT;

-- Recompute search_text from the row + its brand/category/compatible models.
-- On INSERT the product has no compatibilities yet; the product_compatibilities
-- trigger below touches the row afterwards to fold them in.
CREATE OR REPLACE FUNCTION products_set_search_text()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_text := fts_normalize(
    concat_ws(' ',
      NEW.name,
      NEW.sku,
      NEW.origin,
      (SELECT pb.name FROM parts_brands pb WHERE pb.id = NEW.parts_brand_id),
      (SELECT c.name  FROM categories  c  WHERE c.id  = NEW.category_id),
      (SELECT string_agg(cm.name, ' ')
         FROM product_compatibilities pc
         JOIN car_models cm ON cm.id = pc.car_model_id
        WHERE pc.product_id = NEW.id)
    )
  );
  RETURN NEW;
END;
$$;

-- Scoped to the columns that feed the document (incl. search_text itself, so the
-- "touch" updates below re-fire it) — high-frequency writes like viewCount/stock
-- never trigger a recompute.
CREATE TRIGGER products_search_text_biu
BEFORE INSERT OR UPDATE OF name, sku, origin, parts_brand_id, category_id, search_text
ON "products"
FOR EACH ROW
EXECUTE FUNCTION products_set_search_text();

-- Compatibility (car model) changes affect the parent product's document.
-- Touching search_text=NULL re-fires products_set_search_text on the parent.
CREATE OR REPLACE FUNCTION product_compat_refresh()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE "products" SET "search_text" = NULL WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  UPDATE "products" SET "search_text" = NULL WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_compat_search_refresh
AFTER INSERT OR UPDATE OR DELETE
ON "product_compatibilities"
FOR EACH ROW
EXECUTE FUNCTION product_compat_refresh();

-- Renaming a brand/category must propagate into every affected product document.
CREATE OR REPLACE FUNCTION parts_brand_refresh_products()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "products" SET "search_text" = NULL WHERE parts_brand_id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER parts_brands_name_refresh
AFTER UPDATE OF name ON "parts_brands"
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION parts_brand_refresh_products();

CREATE OR REPLACE FUNCTION category_refresh_products()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "products" SET "search_text" = NULL WHERE category_id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER categories_name_refresh
AFTER UPDATE OF name ON "categories"
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION category_refresh_products();

-- Backfill existing rows (fires products_set_search_text, folding in compatibilities).
UPDATE "products" SET "search_text" = NULL;

-- Trigram index for fast word-similarity / similarity lookups.
CREATE INDEX "products_search_text_trgm_idx" ON "products" USING GIN ("search_text" gin_trgm_ops);
