-- Add social link fields to shops table for richer shop pages
-- Run in: Supabase → SQL Editor

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS long_description text;
