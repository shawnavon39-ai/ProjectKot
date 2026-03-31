-- 20 creator shop deals — seeded 2026-03-31
-- IMPORTANT: Verify every product_url before running.
-- Some URLs or prices may have changed — open each URL in a browser first.
-- Products are inserted as on_sale = true so they appear on /deals immediately.
--
-- To run: Supabase dashboard → SQL Editor → paste and execute.

INSERT INTO products (shop_id, name, price, original_price, image_url, product_url, on_sale)

SELECT s.id, p.name, p.price, p.original_price, p.image_url, p.product_url, true
FROM (VALUES

  -- TECH — MrWhosetheBoss
  ('mrwhosetheboss', 'Anker 65W USB-C GaN Charger',          19.99,  34.99, NULL, 'https://www.amazon.co.uk/s?k=anker+65w+gan+charger&tag=findyourshop-21'),
  ('mrwhosetheboss', 'Samsung T7 500GB Portable SSD',         54.99,  79.99, NULL, 'https://www.amazon.co.uk/s?k=samsung+t7+portable+ssd&tag=findyourshop-21'),

  -- FASHION — InTheFrow
  ('inthefrow',      'SKIMS Soft Lounge Long Slip Dress',     58.00,  72.00, NULL, 'https://www.amazon.co.uk/shop/inthefrow'),
  ('inthefrow',      'Spanx Faux Leather Leggings',           70.00,  89.00, NULL, 'https://www.amazon.co.uk/shop/inthefrow'),

  -- HOME — Mrs Hinch Home
  ('mrshinchhome',   'Zoflora Multipack (6 x 500ml)',         12.99,  18.00, NULL, 'https://www.amazon.co.uk/s?k=zoflora+multipack&tag=findyourshop-21'),
  ('mrshinchhome',   'Minky M Cloth 3-Pack',                   7.99,  11.99, NULL, 'https://www.amazon.co.uk/s?k=minky+m+cloth&tag=findyourshop-21'),
  ('mrshinchhome',   'OXO Good Grips Dish Brush Set',          9.99,  14.99, NULL, 'https://www.amazon.co.uk/s?k=oxo+good+grips+dish+brush&tag=findyourshop-21'),

  -- FITNESS — The Body Coach
  ('thebodycoach',   'Optimum Nutrition Gold Standard Whey 2.27kg', 44.99, 59.99, NULL, 'https://www.amazon.co.uk/s?k=optimum+nutrition+gold+standard+whey&tag=findyourshop-21'),
  ('thebodycoach',   'Gymshark Flex High Waisted Leggings',   35.00,  45.00, NULL, 'https://www.amazon.co.uk/shop/thebodycoach'),

  -- FITNESS — Whitney Simmons
  ('whitney-simmons','Lululemon Align Pant 25"',               88.00, 110.00, NULL, 'https://www.amazon.co.uk/shop/whitneysimmons'),

  -- FITNESS — Courtney Black
  ('courtney-black', 'Resistance Band Set (5 levels)',          8.99,  14.99, NULL, 'https://www.amazon.co.uk/s?k=resistance+band+set&tag=findyourshop-21'),

  -- BEAUTY — Lydia Millen
  ('lydia-millen',   'Charlotte Tilbury Flawless Filter',      32.00,  40.00, NULL, 'https://www.amazon.co.uk/shop/lydiamillen'),
  ('lydia-millen',   'NARS Soft Matte Complete Foundation',    28.00,  36.00, NULL, 'https://www.amazon.co.uk/shop/lydiamillen'),

  -- BEAUTY — GK Barry
  ('gk-barry',       'Rhode Peptide Lip Treatment',            19.00,  24.00, NULL, 'https://www.amazon.co.uk/shop/gkbarry'),
  ('gk-barry',       'Laneige Lip Sleeping Mask',              18.00,  23.00, NULL, 'https://www.amazon.co.uk/s?k=laneige+lip+sleeping+mask&tag=findyourshop-21'),

  -- FOOD & DRINK — Pinch of Nom
  ('pinch-of-nom',   'Pinch of Nom: 100 Slimming Home-Style Recipes', 12.99, 20.00, NULL, 'https://www.amazon.co.uk/s?k=pinch+of+nom+book&tag=findyourshop-21'),

  -- FOOD & DRINK — Nara Smith
  ('nara-smith',     'Made In Carbon Steel Frying Pan',        79.00,  99.00, NULL, 'https://www.amazon.co.uk/shop/narasmith'),

  -- FASHION — Holly H (TikTok)
  ('holly-h',        'Pretty Little Thing Co-ord Set',         18.00,  35.00, NULL, 'https://www.tiktok.com/@hollyhxo/shop'),

  -- FASHION — Caitlyn Minimalist (Etsy)
  ('caitlynminimalist', 'Initial Bar Necklace — Sterling Silver', 22.00, 30.00, NULL, 'https://www.etsy.com/shop/CaitlynMinimalist'),

  -- HOME — Lulu and Georgia
  ('lulu-and-georgia', 'Handwoven Jute Basket (set of 3)',     45.00,  65.00, NULL, 'https://www.luluandgeorgia.com')

) AS p(shop_slug, name, price, original_price, image_url, product_url)
JOIN shops s ON s.slug = p.shop_slug AND s.status = 'approved';
