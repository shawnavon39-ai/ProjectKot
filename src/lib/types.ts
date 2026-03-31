/*
  Shared types for the app.

  In Astro (like React), you define your types once and import them
  wherever needed. These match the Supabase table columns exactly.
*/

export interface Shop {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'pinterest' | 'amazon' | 'etsy' | 'depop' | 'shopify' | 'spring' | 'gumroad';
  category: string;
  description: string | null;
  shop_url: string;
  followers: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string | null;
  clicks: number;
  avg_rating: number;
  review_count: number;
  verified: boolean;
}

export interface Product {
  id: string;
  created_at: string;
  shop_id: string;
  name: string;
  price: number | null;
  original_price: number | null;
  image_url: string | null;
  product_url: string;
  on_sale: boolean;
  shop?: Shop;
}

export const platformDisplayNames: Record<Shop['platform'], string> = {
  tiktok: 'TikTok Shop',
  instagram: 'Instagram Shopping',
  youtube: 'YouTube Shopping',
  pinterest: 'Pinterest Shopping',
  amazon: 'Amazon Influencer',
  etsy: 'Etsy',
  depop: 'Depop',
  shopify: 'Shopify Store',
  spring: 'Spring (Merch)',
  gumroad: 'Gumroad',
};

export const platformColours: Record<Shop['platform'], string> = {
  tiktok: 'bg-pink-100 text-pink-800',
  instagram: 'bg-purple-100 text-purple-800',
  youtube: 'bg-red-100 text-red-800',
  pinterest: 'bg-rose-100 text-rose-800',
  amazon: 'bg-amber-100 text-amber-800',
  etsy: 'bg-orange-100 text-orange-800',
  depop: 'bg-green-100 text-green-800',
  shopify: 'bg-emerald-100 text-emerald-800',
  spring: 'bg-sky-100 text-sky-800',
  gumroad: 'bg-fuchsia-100 text-fuchsia-800',
};
