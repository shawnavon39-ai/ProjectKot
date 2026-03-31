/*
  Affiliate link rewriting.

  Each platform has its own affiliate tagging mechanism:
    - Amazon: append ?tag=YOUR_TAG to the URL
    - TikTok: placeholder — update once you have your affiliate ID
    - Others: no affiliate program yet, return the URL unchanged

  Why a dedicated module? When you add new platforms or change tags,
  you update ONE file — not every template that renders a shop link.
  This is a rare case where a small abstraction pays off because
  the logic genuinely varies per platform and will change over time.
*/

type Platform = 'tiktok' | 'instagram' | 'youtube' | 'pinterest' | 'amazon' | 'etsy' | 'depop' | 'shopify' | 'spring' | 'gumroad';

interface AffiliateConfig {
  tag?: string;
  rewrite: (url: string, tag: string) => string;
}

const configs: Record<Platform, AffiliateConfig> = {
  amazon: {
    tag: 'findyourshop-21',
    rewrite: (url, tag) => {
      const u = new URL(url);
      u.searchParams.set('tag', tag);
      return u.toString();
    },
  },

  tiktok: {
    tag: '7130832',
    rewrite: (url, tag) => {
      const u = new URL(url);
      u.searchParams.set('affiliate_id', tag);
      return u.toString();
    },
  },

  // No affiliate programs for these yet — links pass through unchanged
  instagram: { rewrite: (url) => url },
  youtube: { rewrite: (url) => url },
  pinterest: { rewrite: (url) => url },
  depop: { rewrite: (url) => url },
  shopify: { rewrite: (url) => url },
  spring: { rewrite: (url) => url },
  gumroad: { rewrite: (url) => url },
  // Etsy — Awin account closed (2026-03-31), pass through until reapplied
  etsy: { rewrite: (url) => url },
};

export function getAffiliateUrl(platform: Platform, shopUrl: string): string {
  const config = configs[platform];
  if (!config.tag) return shopUrl;

  try {
    return config.rewrite(shopUrl, config.tag);
  } catch {
    // If the URL is malformed, return it unchanged rather than crashing
    return shopUrl;
  }
}
