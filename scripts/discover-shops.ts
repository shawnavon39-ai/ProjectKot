/**
 * discover-shops.ts — automated pipeline to find and seed Amazon Influencer storefronts.
 *
 * Uses Brave Search API to discover amazon.com/shop/ pages,
 * then gently scrapes each storefront for name/description,
 * and inserts them as `pending` into Supabase.
 *
 * Usage:
 *   npx tsx scripts/discover-shops.ts
 *
 * Optional flags:
 *   --dry-run     Output JSON without inserting into Supabase
 *   --category    Override search category (e.g. --category=beauty)
 *   --max-pages   Max search result pages per query (default: 3, max 10)
 *
 * Env vars required:
 *   BRAVE_API_KEY             — Brave Search API key
 *   SUPABASE_URL              — or PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Rate limits:
 *   - Brave free credit: $5/month (~1,000 queries)
 *   - Amazon fetches: 2 second delay between requests
 *
 * Set up a .env file in the project root or export the vars.
 */

import { config } from "dotenv";
config(); // Load .env from project root

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync } from "fs";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const categoryOverride = args
  .find((a) => a.startsWith("--category="))
  ?.split("=")[1];
const maxPages = Math.min(
  parseInt(
    args.find((a) => a.startsWith("--max-pages="))?.split("=")[1] ?? "3"
  ),
  10
);

// Search queries — creator-focused to surface real influencers, not generic storefronts
const SEARCH_QUERIES = [
  // Amazon — creator-linked
  { query: "site:amazon.com/shop fashion influencer tiktok outfit haul", category: "fashion", platform: "amazon" as const },
  { query: "site:amazon.com/shop beauty influencer skincare routine instagram", category: "beauty", platform: "amazon" as const },
  { query: "site:amazon.com/shop tech youtuber setup desk essentials", category: "tech", platform: "amazon" as const },
  { query: "site:amazon.com/shop home decor blogger interior instagram", category: "home", platform: "amazon" as const },
  { query: "site:amazon.com/shop fitness coach workout routine youtube", category: "fitness", platform: "amazon" as const },
  { query: "site:amazon.com/shop food blogger recipe cooking youtube", category: "food-drink", platform: "amazon" as const },
  { query: "site:amazon.com/shop tiktok viral trending tiktokmademebuyit", category: "fashion", platform: "amazon" as const },
  { query: "site:amazon.com/shop amazon finds viral tiktok 2025", category: "beauty", platform: "amazon" as const },
  { query: "site:amazon.com/shop my storefront followers picks", category: "home", platform: "amazon" as const },
  // TikTok — creator profiles with shops
  { query: "site:tiktok.com/@ fashion creator haul outfit style", category: "fashion", platform: "tiktok" as const },
  { query: "site:tiktok.com/@ beauty skincare makeup creator routine", category: "beauty", platform: "tiktok" as const },
  { query: "site:tiktok.com/@ tech gadgets setup creator review", category: "tech", platform: "tiktok" as const },
  { query: "site:tiktok.com/@ home decor interior creator aesthetic", category: "home", platform: "tiktok" as const },
  { query: "site:tiktok.com/@ fitness workout creator gym routine", category: "fitness", platform: "tiktok" as const },
  // YouTube — creator channels with shop/merch
  { query: "site:youtube.com/@ tech reviewer setup essentials merch", category: "tech", platform: "youtube" as const },
  { query: "site:youtube.com/@ beauty makeup skincare youtuber shop", category: "beauty", platform: "youtube" as const },
  { query: "site:youtube.com/@ fitness workout youtuber channel shop", category: "fitness", platform: "youtube" as const },
  { query: "site:youtube.com/@ fashion style haul youtuber shop", category: "fashion", platform: "youtube" as const },
  { query: "site:youtube.com/@ food cooking recipe youtuber merch", category: "food-drink", platform: "youtube" as const },
  // Etsy — handmade and craft creator shops
  { query: "site:etsy.com/shop fashion clothing handmade creator", category: "fashion", platform: "etsy" as const },
  { query: "site:etsy.com/shop beauty skincare handmade natural creator", category: "beauty", platform: "etsy" as const },
  { query: "site:etsy.com/shop home decor handmade prints creator", category: "home", platform: "etsy" as const },
  { query: "site:etsy.com/shop digital download template creator", category: "tech", platform: "etsy" as const },
  { query: "site:etsy.com/shop food drink recipe creator handmade", category: "food-drink", platform: "etsy" as const },
  // Depop — fashion resale creators
  { query: "site:depop.com fashion resale creator vintage style", category: "fashion", platform: "depop" as const },
  { query: "site:depop.com streetwear creator resale vintage", category: "fashion", platform: "depop" as const },
  { query: "site:depop.com beauty skincare resale creator", category: "beauty", platform: "depop" as const },
  // Shopify — creator branded stores
  { query: "site:myshopify.com fashion creator influencer merch store", category: "fashion", platform: "shopify" as const },
  { query: "site:myshopify.com beauty skincare creator influencer brand", category: "beauty", platform: "shopify" as const },
  { query: "site:myshopify.com fitness creator influencer brand store", category: "fitness", platform: "shopify" as const },
  { query: "site:myshopify.com home decor creator influencer brand", category: "home", platform: "shopify" as const },
  // Spring (Teespring) — creator merch
  { query: "site:teespring.com/stores creator merch youtuber tiktok", category: "fashion", platform: "spring" as const },
  { query: "site:teespring.com/stores gaming tech creator merch", category: "tech", platform: "spring" as const },
  { query: "site:teespring.com/stores fitness creator merch", category: "fitness", platform: "spring" as const },
  // Gumroad — digital product creators
  { query: "site:gumroad.com digital products creator templates presets", category: "tech", platform: "gumroad" as const },
  { query: "site:gumroad.com photography presets lightroom creator", category: "beauty", platform: "gumroad" as const },
  { query: "site:gumroad.com ebook guide creator recipe food", category: "food-drink", platform: "gumroad" as const },
  { query: "site:gumroad.com fitness workout plan creator digital", category: "fitness", platform: "gumroad" as const },
];

// Path to track previously seen URLs so we don't re-process them
const SEEN_FILE = "scripts/.discovered-urls.json";

// Category keywords for refining auto-classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  fashion: [
    "fashion",
    "style",
    "outfit",
    "clothing",
    "dress",
    "shoes",
    "wear",
    "wardrobe",
  ],
  beauty: ["beauty", "makeup", "skincare", "cosmetic", "hair", "glow"],
  tech: [
    "tech",
    "gadget",
    "electronic",
    "computer",
    "phone",
    "gaming",
    "desk",
  ],
  home: [
    "home",
    "decor",
    "kitchen",
    "furniture",
    "organization",
    "cozy",
    "house",
  ],
  fitness: [
    "fitness",
    "gym",
    "workout",
    "health",
    "protein",
    "exercise",
    "yoga",
  ],
  "food-drink": ["food", "cook", "recipe", "drink", "bake", "meal"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function refineCategory(text: string, fallback: string): string {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.filter((kw) => lower.includes(kw)).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : fallback;
}

function loadSeenUrls(): Set<string> {
  if (existsSync(SEEN_FILE)) {
    const data = JSON.parse(readFileSync(SEEN_FILE, "utf-8"));
    return new Set(data);
  }
  return new Set();
}

function saveSeenUrls(urls: Set<string>): void {
  writeFileSync(SEEN_FILE, JSON.stringify([...urls], null, 2));
}

/**
 * Extract the amazon.com/shop/ handle from a URL.
 * Returns null if it's not an influencer storefront.
 */
function extractHandle(url: string): string | null {
  const match = url.match(/amazon\.[a-z.]+\/shop\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const handle = match[1].toLowerCase();
  // Filter out generic Amazon pages
  if (["shop", "b", "s", "dp", "gp"].includes(handle)) return null;
  return handle;
}

function extractEtsyHandle(url: string): string | null {
  const match = url.match(/etsy\.com\/shop\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const handle = match[1].toLowerCase();
  if (["sold", "listing", "search", "market"].includes(handle)) return null;
  return handle;
}

function extractDepopHandle(url: string): string | null {
  const match = url.match(/depop\.com\/([a-zA-Z0-9_.-]+)\/?$/);
  if (!match) return null;
  const handle = match[1].toLowerCase();
  if (["explore", "category", "search", "login", "signup", "about", "blog", "products"].includes(handle)) return null;
  return handle;
}

function extractShopifyHandle(url: string): string | null {
  const match = url.match(/([a-zA-Z0-9-]+)\.myshopify\.com/);
  if (!match) return null;
  const handle = match[1].toLowerCase();
  if (["myshopify", "admin", "accounts", "checkout"].includes(handle)) return null;
  return handle;
}

function extractSpringHandle(url: string): string | null {
  // teespring.com/stores/name or spring.com/name
  const teeMatch = url.match(/teespring\.com\/stores\/([a-zA-Z0-9_-]+)/);
  if (teeMatch) return teeMatch[1].toLowerCase();
  const springMatch = url.match(/spring\.com\/([a-zA-Z0-9_-]+)/);
  if (springMatch) {
    const handle = springMatch[1].toLowerCase();
    if (["shop", "stores", "about", "blog", "contact"].includes(handle)) return null;
    return handle;
  }
  return null;
}

function extractGumroadHandle(url: string): string | null {
  const match = url.match(/gumroad\.com\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const handle = match[1].toLowerCase();
  if (["l", "p", "products", "discover", "about", "signup", "login", "blog"].includes(handle)) return null;
  return handle;
}

function extractTikTokHandle(url: string): string | null {
  const match = url.match(/tiktok\.com\/@([a-zA-Z0-9._-]+)/);
  if (!match) return null;
  const handle = match[1].toLowerCase();
  if (["explore", "following", "live", "music", "shop", "video", "trending"].includes(handle)) return null;
  return handle;
}

function extractYouTubeHandle(url: string): string | null {
  const atMatch = url.match(/youtube\.com\/@([a-zA-Z0-9._-]+)/);
  if (atMatch) return atMatch[1].toLowerCase();
  const cMatch = url.match(/youtube\.com\/c\/([a-zA-Z0-9._-]+)/);
  if (cMatch) return cMatch[1].toLowerCase();
  return null;
}

// Patterns that indicate a generic/spam storefront with no real creator behind it
const GENERIC_PATTERNS = [
  /^(cool|amazing|smart|future|unique|top|best|great|awesome)\s+\w+$/i,
  /^(gadgets?|products?|deals?|finds?|picks?|favorites?|items?|stuff)$/i,
  /^amazon\s+(customer|favorites|finds|store)$/i,
  /^(home|kitchen|beauty|fashion|fitness|tech)\s+(decor|gadgets?|products?|finds?|ideas?)$/i,
  /^my\s+(amazon\s+)?(storefront|store|shop|picks|favorites|finds|recommendations?)$/i,
  /^(shop|store)\s+(today|now|here|online)$/i,
];

/**
 * Returns false for generic keyword storefronts that have no real creator behind them.
 * We only want shops from actual influencers/creators with a real audience.
 */
function isQualityShop(name: string): boolean {
  const trimmed = name.trim();
  // Too short to be meaningful
  if (trimmed.length < 4) return false;
  // Matches a known generic pattern
  if (GENERIC_PATTERNS.some((p) => p.test(trimmed))) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Brave Search
// ---------------------------------------------------------------------------

interface SearchResult {
  link: string;
  title: string;
  snippet: string;
}

async function searchBrave(
  query: string,
  offset: number = 0
): Promise<SearchResult[]> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "20");
  if (offset > 0) {
    url.searchParams.set("offset", String(offset));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": BRAVE_API_KEY!,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) {
      console.error("  Brave API rate limit reached. Try again later.");
      return [];
    }
    console.error(`  Brave API error ${res.status}: ${body.slice(0, 200)}`);
    return [];
  }

  const data = await res.json();
  const results = data.web?.results ?? [];

  return results.map((item: any) => ({
    link: item.url,
    title: item.title ?? "",
    snippet: item.description ?? "",
  }));
}

// ---------------------------------------------------------------------------
// Amazon Storefront — extract data from Brave search results directly
// (avoids scraping Amazon, which can block requests)
// ---------------------------------------------------------------------------

type SupportedPlatform = "amazon" | "tiktok" | "youtube" | "etsy" | "depop" | "shopify" | "spring" | "gumroad";

interface ShopData {
  name: string;
  shop_url: string;
  platform: SupportedPlatform;
  category: string;
  description: string;
  handle: string;
}

function buildShopUrl(platform: SupportedPlatform, handle: string): string {
  if (platform === "tiktok") return `https://www.tiktok.com/@${handle}`;
  if (platform === "youtube") return `https://www.youtube.com/@${handle}`;
  if (platform === "etsy") return `https://www.etsy.com/shop/${handle}`;
  if (platform === "depop") return `https://www.depop.com/${handle}`;
  if (platform === "shopify") return `https://${handle}.myshopify.com`;
  if (platform === "spring") return `https://www.teespring.com/stores/${handle}`;
  if (platform === "gumroad") return `https://gumroad.com/${handle}`;
  return `https://www.amazon.com/shop/${handle}`;
}

function extractShopFromSearchResult(
  result: SearchResult,
  handle: string,
  fallbackCategory: string,
  platform: SupportedPlatform = "amazon"
): ShopData {
  // Clean up the title from Brave results
  let name = result.title
    .replace(/'s Amazon Page$/i, "")
    .replace(/\s*[\|–—].*$/, "")
    .replace(/Amazon\.com:\s*/i, "")
    .replace(/\s*-\s*amazon\s.*$/i, "")
    .trim();

  if (!name || name.length < 2) {
    name = handle;
  }

  // Clean up description — strip HTML tags
  const description =
    result.snippet
      .replace(/<\/?strong>/gi, "")
      .replace(/&amp;/g, "&")
      .replace(/&#x27;/g, "'")
      .slice(0, 200)
      .trim() || `${name}'s curated picks on Amazon`;

  const category = refineCategory(
    `${name} ${description}`,
    fallbackCategory
  );

  return {
    name,
    shop_url: buildShopUrl(platform, handle),
    platform,
    category,
    description,
    handle,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Validate env
  if (!BRAVE_API_KEY) {
    console.error("Missing BRAVE_API_KEY env var.");
    console.error("\nSetup:");
    console.error("1. Sign up at brave.com/search/api");
    console.error("2. Get your API key");
    console.error("3. Set BRAVE_API_KEY in your .env file");
    process.exit(1);
  }

  if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use --dry-run to skip DB insertion."
    );
    process.exit(1);
  }

  const supabase = DRY_RUN
    ? null
    : createClient(SUPABASE_URL!, SUPABASE_KEY!);

  const seenUrls = loadSeenUrls();
  const queries = categoryOverride
    ? SEARCH_QUERIES.filter((q) => q.category === categoryOverride)
    : SEARCH_QUERIES;

  if (queries.length === 0) {
    console.error(`Unknown category: ${categoryOverride}`);
    process.exit(1);
  }

  const discovered: ShopData[] = [];
  let apiQueries = 0;

  console.log(
    `Starting discovery (${queries.length} categories, ${maxPages} pages each)${DRY_RUN ? " [DRY RUN]" : ""}\n`
  );

  for (const { query, category, platform } of queries) {
    console.log(`Searching: ${platform}/${category}`);

    for (let page = 0; page < maxPages; page++) {
      const offset = page * 20;
      const results = await searchBrave(query, offset);
      apiQueries++;

      if (results.length === 0) break;

      for (const result of results) {
        let handle: string | null = null;
        if (platform === "amazon") handle = extractHandle(result.link);
        else if (platform === "tiktok") handle = extractTikTokHandle(result.link);
        else if (platform === "youtube") handle = extractYouTubeHandle(result.link);
        else if (platform === "etsy") handle = extractEtsyHandle(result.link);
        else if (platform === "depop") handle = extractDepopHandle(result.link);
        else if (platform === "shopify") handle = extractShopifyHandle(result.link);
        else if (platform === "spring") handle = extractSpringHandle(result.link);
        else if (platform === "gumroad") handle = extractGumroadHandle(result.link);
        if (!handle) continue;

        const shopUrl = buildShopUrl(platform, handle);
        if (seenUrls.has(shopUrl)) continue;

        seenUrls.add(shopUrl);

        const shop = extractShopFromSearchResult(result, handle, category, platform);

        if (!isQualityShop(shop.name)) {
          console.log(`  ✗ ${shop.name} (filtered — generic name)`);
          continue;
        }

        discovered.push(shop);
        console.log(`  ✓ ${shop.name} (${shop.category})`);
      }

      // Pause between search pages
      await sleep(1000);
    }
  }

  console.log(
    `\nDiscovered ${discovered.length} new shops (used ${apiQueries} Brave API queries)`
  );

  // Save seen URLs for next run
  saveSeenUrls(seenUrls);

  if (discovered.length === 0) {
    console.log("No new shops found. Try again later for fresh results.");
    return;
  }

  // Write output JSON regardless
  const outPath = "scripts/discovered-shops.json";
  writeFileSync(outPath, JSON.stringify(discovered, null, 2));
  console.log(`Wrote ${discovered.length} shops to ${outPath}`);

  if (DRY_RUN) {
    console.log("Dry run complete — no shops inserted into Supabase.");
    return;
  }

  // Insert into Supabase
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const shop of discovered) {
    const slug = slugify(shop.name);

    // Check for existing by URL or slug
    const { data: existing } = await supabase!
      .from("shops")
      .select("id")
      .or(`shop_url.eq.${shop.shop_url},slug.eq.${slug}`)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    const { error } = await supabase!.from("shops").insert({
      name: shop.name,
      slug,
      shop_url: shop.shop_url,
      platform: shop.platform,
      category: shop.category,
      description: shop.description,
      followers: null,
      status: "approved",
      submitted_by: null,
      clicks: 0,
      avg_rating: 0,
      review_count: 0,
    });

    if (error) {
      console.error(`  Error inserting "${shop.name}": ${error.message}`);
      errors++;
    } else {
      inserted++;
    }
  }

  console.log(
    `\nInserted: ${inserted}, Skipped: ${skipped} (duplicates), Errors: ${errors}`
  );
  console.log("All shops inserted as 'pending' — review them at /admin.");
}

main();
