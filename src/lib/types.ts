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
  platform: 'tiktok' | 'instagram' | 'youtube' | 'pinterest' | 'amazon';
  category: string;
  description: string | null;
  shop_url: string;
  followers: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string | null;
}

export const platformDisplayNames: Record<Shop['platform'], string> = {
  tiktok: 'TikTok Shop',
  instagram: 'Instagram Shopping',
  youtube: 'YouTube Shopping',
  pinterest: 'Pinterest Shopping',
  amazon: 'Amazon Influencer',
};

export const platformColours: Record<Shop['platform'], string> = {
  tiktok: 'bg-pink-100 text-pink-800',
  instagram: 'bg-purple-100 text-purple-800',
  youtube: 'bg-red-100 text-red-800',
  pinterest: 'bg-rose-100 text-rose-800',
  amazon: 'bg-amber-100 text-amber-800',
};
