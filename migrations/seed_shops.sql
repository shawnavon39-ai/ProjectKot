-- Seed: 20 creator shops across all platforms and categories
-- IMPORTANT: Verify every shop_url before running.
-- Some URLs may have changed since this was written (2026-03-31).
-- Quick check: open each URL in a browser before executing.
--
-- To run: Supabase dashboard → SQL Editor → paste and execute.
-- Shops are inserted as 'approved' and will appear on the site immediately.

INSERT INTO shops (name, slug, platform, category, description, shop_url, followers, status, verified)
VALUES

-- ============================================================
-- AMAZON
-- ============================================================

(
  'MrWhosetheBoss',
  'mrwhosetheboss',
  'amazon',
  'tech',
  'Arun Maini''s Amazon storefront — one of the UK''s biggest tech YouTubers. Phones, gadgets, and accessories he actually uses.',
  'https://www.amazon.co.uk/shop/mrwhosetheboss',
  '9M+ YouTube',
  'approved',
  true
),

(
  'InTheFrow',
  'inthefrow',
  'amazon',
  'fashion',
  'Victoria Magrath''s Amazon picks — luxury fashion, beauty, and lifestyle curated by one of the UK''s top fashion bloggers.',
  'https://www.amazon.co.uk/shop/inthefrow',
  '1M+ Instagram',
  'approved',
  true
),

(
  'Mrs Hinch Home',
  'mrshinchhome',
  'amazon',
  'home',
  'Sophie Hinchcliffe''s Amazon storefront — cleaning products, home organisation, and interiors from the queen of #hinching.',
  'https://www.amazon.co.uk/shop/mrshinchhome',
  '4M+ Instagram',
  'approved',
  true
),

(
  'The Body Coach',
  'thebodycoach',
  'amazon',
  'fitness',
  'Joe Wicks'' Amazon picks — fitness equipment, nutrition, and wellness products from the UK''s most-followed fitness creator.',
  'https://www.amazon.co.uk/shop/thebodycoach',
  '4M+ Instagram',
  'approved',
  true
),

(
  'Lydia Millen',
  'lydia-millen',
  'amazon',
  'beauty',
  'Lydia Millen''s luxury Amazon edits — beauty, fashion, and lifestyle from one of the UK''s top luxury lifestyle creators.',
  'https://www.amazon.co.uk/shop/lydiaelisemillen',
  '700K+ YouTube',
  'approved',
  true
),

-- ============================================================
-- TIKTOK
-- ============================================================

(
  'Mikayla Nogueira',
  'mikayla-nogueira',
  'tiktok',
  'beauty',
  'Mikayla''s TikTok shop — the products she actually uses and reviews. One of TikTok''s most trusted beauty voices.',
  'https://www.tiktok.com/@mikaylanogueira/shop',
  '15M+ TikTok',
  'approved',
  true
),

(
  'Nara Smith',
  'nara-smith',
  'tiktok',
  'food-drink',
  'Nara Smith''s TikTok shop — cookware, kitchen tools, and homeware from the aesthetic lifestyle and cooking creator.',
  'https://www.tiktok.com/@narasmithh/shop',
  '8M+ TikTok',
  'approved',
  true
),

(
  'GK Barry',
  'gk-barry',
  'tiktok',
  'beauty',
  'Grace Keeling''s TikTok shop — beauty and lifestyle picks from the UK comedian and podcast host.',
  'https://www.tiktok.com/@gkbarry/shop',
  '5M+ TikTok',
  'approved',
  true
),

(
  'Holly H',
  'holly-h',
  'tiktok',
  'fashion',
  'Holly Hearfield''s TikTok fashion shop — trending outfits, accessories, and wardrobe picks.',
  'https://www.tiktok.com/@hollyh/shop',
  '3M+ TikTok',
  'approved',
  true
),

-- ============================================================
-- ETSY
-- ============================================================

(
  'CaitlynMinimalist',
  'caitlynminimalist',
  'etsy',
  'fashion',
  'Dainty minimalist jewellery — personalised necklaces, rings, and bracelets. One of Etsy''s most popular jewellery shops worldwide.',
  'https://www.etsy.com/shop/CaitlynMinimalist',
  '2M+ sales',
  'approved',
  true
),

(
  'ModParty',
  'modparty',
  'etsy',
  'home',
  'Party supplies, personalised gifts, and home decor. One of Etsy''s top-selling home and lifestyle shops.',
  'https://www.etsy.com/shop/ModParty',
  '1M+ sales',
  'approved',
  true
),

(
  'OliveAnatolian',
  'olive-anatolian',
  'etsy',
  'home',
  'Handwoven Turkish towels, rugs, and textiles. Sustainable home goods crafted by artisans.',
  'https://www.etsy.com/shop/OliveAnatolian',
  '50K+ sales',
  'approved',
  false
),

(
  'The Soap Gal',
  'the-soap-gal',
  'etsy',
  'beauty',
  'Handmade natural soaps, bath bombs, and skincare. Small-batch, cruelty-free beauty products.',
  'https://www.etsy.com/shop/TheSoapGal',
  '30K+ sales',
  'approved',
  false
),

-- ============================================================
-- DEPOP
-- ============================================================

(
  'Tanya Burr',
  'tanya-burr',
  'depop',
  'fashion',
  'Tanya Burr''s Depop — pre-loved fashion and wardrobe clearouts from the UK YouTuber and actress.',
  'https://www.depop.com/tanyaburr',
  '3M+ YouTube',
  'approved',
  true
),

(
  'Lucy Moon',
  'lucy-moon',
  'depop',
  'fashion',
  'Lucy Moon''s curated pre-loved wardrobe — vintage and secondhand fashion from the sustainable style creator.',
  'https://www.depop.com/lucymoon',
  '500K+ YouTube',
  'approved',
  true
),

-- ============================================================
-- INSTAGRAM
-- ============================================================

(
  'Camille Charriere',
  'camille-charriere',
  'instagram',
  'fashion',
  'Camille Charriere''s Instagram shop — effortless Parisian style picks, curated by the fashion editor and influencer.',
  'https://www.instagram.com/camillecharriere',
  '1M+ Instagram',
  'approved',
  true
),

-- ============================================================
-- SHOPIFY
-- ============================================================

(
  'TALA',
  'tala',
  'shopify',
  'fitness',
  'Grace Beverley''s sustainable activewear brand. Built for real training, designed with sustainability at the core.',
  'https://www.wearetala.com',
  '1M+ Instagram',
  'approved',
  true
),

-- ============================================================
-- YOUTUBE
-- ============================================================

(
  'James Welsh',
  'james-welsh',
  'youtube',
  'beauty',
  'James Welsh''s skincare recommendations — evidence-based skincare picks from the UK''s most trusted skincare YouTuber.',
  'https://www.youtube.com/c/JamesWelsh',
  '800K+ YouTube',
  'approved',
  true
),

-- ============================================================
-- SPRING (MERCH)
-- ============================================================

(
  'Mark Rober',
  'mark-rober',
  'spring',
  'tech',
  'Mark Rober''s merch store — science and engineering themed apparel from the NASA engineer turned YouTube creator.',
  'https://markrober.store',
  '50M+ YouTube',
  'approved',
  true
),

-- ============================================================
-- GUMROAD
-- ============================================================

(
  'Ali Abdaal',
  'ali-abdaal',
  'gumroad',
  'tech',
  'Ali Abdaal''s digital products — productivity courses, templates, and resources from the UK doctor turned productivity YouTuber.',
  'https://aliabdaal.gumroad.com',
  '5M+ YouTube',
  'approved',
  true
);

-- Verify the insert worked:
SELECT name, platform, category, verified FROM shops ORDER BY created_at DESC LIMIT 20;
