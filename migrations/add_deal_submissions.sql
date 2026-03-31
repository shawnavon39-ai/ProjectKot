-- Deal submissions table — allows creators/users to suggest deals
-- Admin reviews via /admin before anything goes live
-- Run in: Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS deal_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  shop_name text NOT NULL,
  product_name text NOT NULL,
  product_url text NOT NULL,
  price numeric(10,2),
  original_price numeric(10,2),
  image_url text,
  submitter_email text,
  notes text,
  status text NOT NULL DEFAULT 'pending'
);

-- Allow anyone to insert (submit a deal)
ALTER TABLE deal_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a deal"
ON deal_submissions FOR INSERT
WITH CHECK (true);

-- Only service role can read (admin only via API)
-- No SELECT policy needed for anon — reads happen via service role key in admin API
