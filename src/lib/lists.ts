import type { Shop } from './types';

export type SortOption = 'rating' | 'popular' | 'newest';

export interface CuratedList {
  slug: string;
  title: string;
  description: string;
  platform?: Shop['platform'];
  category?: string;
  sort: SortOption;
  limit: number;
}

export const curatedLists: CuratedList[] = [
  {
    slug: 'top-tiktok-fashion-shops',
    title: 'Top TikTok Fashion Shops',
    description: 'The best fashion creator shops on TikTok Shop — rated and reviewed by real shoppers.',
    platform: 'tiktok',
    category: 'fashion',
    sort: 'rating',
    limit: 20,
  },
  {
    slug: 'best-amazon-beauty-storefronts',
    title: 'Best Amazon Beauty Storefronts',
    description: 'Top-rated beauty and skincare creator storefronts on Amazon Influencer.',
    platform: 'amazon',
    category: 'beauty',
    sort: 'rating',
    limit: 20,
  },
  {
    slug: 'most-popular-tiktok-shops',
    title: 'Most Popular TikTok Shops',
    description: 'The most-visited TikTok creator shops on Pick Your Shop right now.',
    platform: 'tiktok',
    sort: 'popular',
    limit: 20,
  },
  {
    slug: 'top-rated-beauty-shops',
    title: 'Top Rated Beauty Shops',
    description: 'The highest-rated beauty creator shops across all platforms — community reviewed.',
    category: 'beauty',
    sort: 'rating',
    limit: 20,
  },
  {
    slug: 'best-home-living-creator-shops',
    title: 'Best Home & Living Creator Shops',
    description: 'Creator shops for home décor, interiors, and lifestyle across TikTok, Amazon, and more.',
    category: 'home',
    sort: 'rating',
    limit: 20,
  },
  {
    slug: 'top-amazon-fashion-storefronts',
    title: 'Top Amazon Fashion Storefronts',
    description: 'The best fashion creator storefronts on Amazon Influencer — curated and community rated.',
    platform: 'amazon',
    category: 'fashion',
    sort: 'rating',
    limit: 20,
  },
  {
    slug: 'most-popular-creator-shops',
    title: 'Most Popular Creator Shops',
    description: 'The most-clicked creator shops on Pick Your Shop across every platform.',
    sort: 'popular',
    limit: 20,
  },
  {
    slug: 'gift-ideas-for-her',
    title: 'Gift Ideas for Her — Creator Picks',
    description: 'Fashion, beauty, and lifestyle creator shops perfect for gifting. Curated picks from the UK\'s top creators.',
    category: 'fashion',
    sort: 'rating',
    limit: 20,
  },
  {
    slug: 'gift-ideas-for-him',
    title: 'Gift Ideas for Him — Creator Picks',
    description: 'Tech, fitness, and lifestyle creator shops with great gifting options for men.',
    category: 'tech',
    sort: 'rating',
    limit: 20,
  },
  {
    slug: 'home-gifts-from-creators',
    title: 'Home Gifts from Creators',
    description: 'Creator-curated home décor and lifestyle shops — great for housewarming gifts or treating yourself.',
    category: 'home',
    sort: 'rating',
    limit: 20,
  },
  {
    slug: 'fitness-gifts-from-creators',
    title: 'Fitness Gifts from Creators',
    description: 'Gym gear, nutrition, and wellness picks from the UK\'s top fitness creators.',
    category: 'fitness',
    sort: 'rating',
    limit: 20,
  },
  {
    slug: 'beauty-gifts-from-creators',
    title: 'Beauty Gifts from Creators',
    description: 'Skincare, makeup, and wellness creator shops — community-rated and perfect for gifting.',
    category: 'beauty',
    sort: 'rating',
    limit: 20,
  },
];

export function getListBySlug(slug: string): CuratedList | undefined {
  return curatedLists.find(l => l.slug === slug);
}
