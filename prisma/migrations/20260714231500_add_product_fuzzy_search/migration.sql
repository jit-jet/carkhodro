-- Normalize Persian/Arabic text identically to src/lib/persian.ts.
CREATE OR REPLACE FUNCTION fts_normalize(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT btrim(
    regexp_replace(
      regexp_replace(
        lower(
          translate(
            coalesce(input_text, ''),
            '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹يك',
            '01234567890123456789یک'
          )
        ),
        '[‌ـ]',
        '',
        'g'
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );
$$;

-- Keep one normalized document per product. A compact copy is appended so
-- queries with omitted spaces (for example "موتور4لیتری") still match.
CREATE OR REPLACE FUNCTION set_product_search_text()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := fts_normalize(concat_ws(
    ' ',
    NEW.name,
    NEW.sku,
    NEW.origin,
    (SELECT name FROM parts_brands WHERE id = NEW.parts_brand_id),
    (SELECT name FROM categories WHERE id = NEW.category_id),
    (
      SELECT string_agg(cm.name, ' ' ORDER BY cm.name)
      FROM product_compatibilities pc
      JOIN car_models cm ON cm.id = pc.car_model_id
      WHERE pc.product_id = NEW.id
    )
  ));

  NEW.search_text := concat_ws(' ', normalized, replace(normalized, ' ', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_search_text_trigger ON products;
CREATE TRIGGER products_search_text_trigger
BEFORE INSERT OR UPDATE OF name, sku, origin, parts_brand_id, category_id
ON products
FOR EACH ROW
EXECUTE FUNCTION set_product_search_text();

-- Rebuild a product document when compatibility or related display names change.
CREATE OR REPLACE FUNCTION refresh_product_search_text()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'product_compatibilities' THEN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
      UPDATE products SET name = name WHERE id = OLD.product_id;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
      UPDATE products SET name = name WHERE id = NEW.product_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'parts_brands' THEN
    UPDATE products SET name = name WHERE parts_brand_id = NEW.id;
  ELSIF TG_TABLE_NAME = 'categories' THEN
    UPDATE products SET name = name WHERE category_id = NEW.id;
  ELSIF TG_TABLE_NAME = 'car_models' THEN
    UPDATE products
    SET name = name
    WHERE id IN (
      SELECT product_id
      FROM product_compatibilities
      WHERE car_model_id = NEW.id
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_compatibilities_search_text_trigger ON product_compatibilities;
CREATE TRIGGER product_compatibilities_search_text_trigger
AFTER INSERT OR UPDATE OF product_id, car_model_id OR DELETE
ON product_compatibilities
FOR EACH ROW
EXECUTE FUNCTION refresh_product_search_text();

DROP TRIGGER IF EXISTS parts_brands_search_text_trigger ON parts_brands;
CREATE TRIGGER parts_brands_search_text_trigger
AFTER UPDATE OF name
ON parts_brands
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION refresh_product_search_text();

DROP TRIGGER IF EXISTS categories_search_text_trigger ON categories;
CREATE TRIGGER categories_search_text_trigger
AFTER UPDATE OF name
ON categories
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION refresh_product_search_text();

DROP TRIGGER IF EXISTS car_models_search_text_trigger ON car_models;
CREATE TRIGGER car_models_search_text_trigger
AFTER UPDATE OF name
ON car_models
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION refresh_product_search_text();

-- Populate existing rows immediately.
UPDATE products SET name = name;
