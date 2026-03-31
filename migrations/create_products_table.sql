-- Create products table
-- Run in Supabase dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2),
  original_price numeric(10,2),
  image_url text,
  product_url text NOT NULL,
  on_sale boolean NOT NULL DEFAULT false
);

-- Index for fetching products by shop
CREATE INDEX IF NOT EXISTS products_shop_id_idx ON products(shop_id);

-- Index for deals page (on_sale = true)
CREATE INDEX IF NOT EXISTS products_on_sale_idx ON products(on_sale) WHERE on_sale = true;
