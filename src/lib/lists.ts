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
];

export function getListBySlug(slug: string): CuratedList | undefined {
  return curatedLists.find(l => l.slug === slug);
}
