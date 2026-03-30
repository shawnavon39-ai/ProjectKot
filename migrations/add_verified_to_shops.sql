-- Add verified flag to shops
-- Run in Supabase dashboard → SQL Editor

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- To manually verify a shop once the column exists:
-- UPDATE shops SET verified = true WHERE slug = 'your-shop-slug';
