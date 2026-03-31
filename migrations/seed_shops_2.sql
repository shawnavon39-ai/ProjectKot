-- Seed batch 2: filling category gaps
-- Targets: fitness, food-drink, home, tech, other + Pinterest representation
-- IMPORTANT: Verify all URLs before running — some may have changed since 2026-03-31
-- Run in Supabase dashboard → SQL Editor

INSERT INTO shops (name, slug, platform, category, description, shop_url, followers, status, verified)
VALUES

-- ============================================================
-- FOOD & DRINK (adding 4 more)
-- ============================================================

(
  'Pinch of Nom',
  'pinch-of-nom',
  'shopify',
  'food-drink',
  'Kay and Kate Allinson''s official shop — books, meal planners, and kitchen tools from the UK''s biggest slimming food blog.',
  'https://www.pinchofnom.com/shop',
  '4M+ Facebook',
  'approved',
  true
),

(
  'Mob Kitchen',
  'mob-kitchen',
  'shopify',
  'food-drink',
  'Mob Kitchen''s shop — cookbooks, kitchen essentials, and merchandise from the popular budget cooking brand.',
  'https://www.mobkitchen.co.uk/collections/shop',
  '2M+ Instagram',
  'approved',
  true
),

(
  'Joshua Weissman',
  'joshua-weissman',
  'youtube',
  'food-drink',
  'Joshua Weissman''s shop — cookbooks and kitchen gear from the fast food copycat and homemade cooking YouTuber.',
  'https://www.youtube.com/@JoshuaWeissman',
  '9M+ YouTube',
  'approved',
  true
),

(
  'Half Baked Harvest',
  'half-baked-harvest',
  'amazon',
  'food-drink',
  'Tieghan Gerard''s Amazon picks — kitchen tools, cookware, and pantry staples from the Half Baked Harvest creator.',
  'https://www.amazon.com/shop/halfbakedharvest',
  '4M+ Instagram',
  'approved',
  true
),

(
  'Tabitha Brown',
  'tabitha-brown',
  'tiktok',
  'food-drink',
  'Tabitha Brown''s TikTok shop — plant-based cooking tools and lifestyle products from the vegan comfort food creator.',
  'https://www.tiktok.com/@iamtabithabrown/shop',
  '5M+ TikTok',
  'approved',
  true
),

-- ============================================================
-- FITNESS (adding 4 more)
-- ============================================================

(
  'Whitney Simmons',
  'whitney-simmons',
  'amazon',
  'fitness',
  'Whitney Simmons'' Amazon storefront — gym equipment, supplements, and activewear from the fitness creator and Gymshark athlete.',
  'https://www.amazon.com/shop/whitneysimmons',
  '3M+ Instagram',
  'approved',
  true
),

(
  'Chloe Ting',
  'chloe-ting',
  'shopify',
  'fitness',
  'Chloe Ting''s official store — workout programs, fitness guides, and merchandise from the free home workout creator.',
  'https://www.chloeting.com/shop',
  '24M+ YouTube',
  'approved',
  true
),

(
  'Courtney Black',
  'courtney-black',
  'amazon',
  'fitness',
  'Courtney Black''s Amazon storefront — fitness equipment and activewear picks from the UK personal trainer and fitness creator.',
  'https://www.amazon.co.uk/shop/courtneyblackfitness',
  '1M+ Instagram',
  'approved',
  true
),

(
  'Jeff Nippard',
  'jeff-nippard',
  'spring',
  'fitness',
  'Jeff Nippard''s merch store — science-based fitness apparel and accessories from the evidence-based bodybuilding YouTuber.',
  'https://jeff-nippard.creator-spring.com',
  '5M+ YouTube',
  'approved',
  true
),

-- ============================================================
-- HOME (adding 3 more)
-- ============================================================

(
  'Lulu and Georgia',
  'lulu-and-georgia',
  'shopify',
  'home',
  'Curated home decor, furniture, and rugs from the lifestyle brand loved by interior creators across Pinterest and Instagram.',
  'https://www.luluandgeorgia.com',
  '1M+ Instagram',
  'approved',
  true
),

(
  'Elsie Larson',
  'elsie-larson',
  'shopify',
  'home',
  'A Beautiful Mess shop — home decor, craft supplies, and lifestyle products from Elsie Larson''s creative lifestyle brand.',
  'https://abeautifulmess.com/shop',
  '1M+ Instagram',
  'approved',
  true
),

(
  'Medleymade',
  'medleymade',
  'etsy',
  'home',
  'Handmade macramé wall hangings, plant hangers, and boho home décor. A top-rated Etsy home creator.',
  'https://www.etsy.com/shop/Medleymade',
  '100K+ sales',
  'approved',
  false
),

-- ============================================================
-- TECH (adding 2 more)
-- ============================================================

(
  'MKBHD',
  'mkbhd',
  'shopify',
  'tech',
  'Marques Brownlee''s official merch — quality tech-themed apparel and accessories from the world''s most respected tech YouTuber.',
  'https://shop.mkbhd.com',
  '18M+ YouTube',
  'approved',
  true
),

(
  'Linus Tech Tips',
  'linus-tech-tips',
  'shopify',
  'tech',
  'Linus Tech Tips official store — screwdrivers, apparel, and tech accessories from the world''s biggest tech YouTube channel.',
  'https://www.lttstore.com',
  '15M+ YouTube',
  'approved',
  true
),

-- ============================================================
-- OTHER (adding 3)
-- ============================================================

(
  'Simply Nailogical',
  'simply-nailogical',
  'shopify',
  'other',
  'Christine Rotenberg''s Holo Taco nail polish brand — holographic and unique nail polishes from the nail art creator.',
  'https://www.holotaco.com',
  '7M+ YouTube',
  'approved',
  true
),

(
  'Jacksepticeye',
  'jacksepticeye',
  'spring',
  'other',
  'Seán McLoughlin''s merch store — apparel, accessories, and collectibles from one of YouTube''s most beloved gaming creators.',
  'https://jacksepticeye.com/collections/all',
  '30M+ YouTube',
  'approved',
  true
),

(
  'Iamtherealak',
  'iamtherealak',
  'tiktok',
  'other',
  'Pet care and animal lover products from a popular TikTok pet creator — toys, accessories, and gifts for pet owners.',
  'https://www.tiktok.com/@iamtherealak/shop',
  '2M+ TikTok',
  'approved',
  false
),

-- ============================================================
-- PINTEREST (adding 2)
-- ============================================================

(
  'Studio McGee',
  'studio-mcgee',
  'pinterest',
  'home',
  'Shea McGee''s curated home decor and interior design products — as seen on Netflix''s Dream Home Makeover.',
  'https://www.pinterest.com/studiomcgee',
  '10M+ Pinterest',
  'approved',
  true
),

(
  'Amber Fillerup Clark',
  'amber-fillerup-clark',
  'pinterest',
  'fashion',
  'Barefoot Blonde''s Pinterest shop — fashion, beauty, and lifestyle picks from the popular lifestyle and fashion creator.',
  'https://www.pinterest.com/amberfillerup',
  '2M+ Pinterest',
  'approved',
  true
);

-- Verify:
SELECT category, COUNT(*) as count FROM shops WHERE status = 'approved' GROUP BY category ORDER BY count DESC;
