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

// Search queries — each targets a different category
const SEARCH_QUERIES = [
  { query: "site:amazon.com/shop fashion style outfit", category: "fashion" },
  { query: "site:amazon.com/shop beauty makeup skincare", category: "beauty" },
  { query: "site:amazon.com/shop tech gadgets electronics", category: "tech" },
  { query: "site:amazon.com/shop home decor kitchen", category: "home" },
  { query: "site:amazon.com/shop fitness gym workout", category: "fitness" },
  {
    query: "site:amazon.com/shop food cooking kitchen essentials",
    category: "food-drink",
  },
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

interface ShopData {
  name: string;
  shop_url: string;
  platform: "amazon";
  category: string;
  description: string;
  handle: string;
}

function extractShopFromSearchResult(
  result: SearchResult,
  handle: string,
  fallbackCategory: string
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
    shop_url: `https://www.amazon.com/shop/${handle}`,
    platform: "amazon",
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

  for (const { query, category } of queries) {
    console.log(`Searching: ${category}`);

    for (let page = 0; page < maxPages; page++) {
      const offset = page * 20;
      const results = await searchBrave(query, offset);
      apiQueries++;

      if (results.length === 0) break;

      for (const result of results) {
        const handle = extractHandle(result.link);
        if (!handle) continue;

        const shopUrl = `https://www.amazon.com/shop/${handle}`;
        if (seenUrls.has(shopUrl)) continue;

        seenUrls.add(shopUrl);

        const shop = extractShopFromSearchResult(result, handle, category);
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
      status: "pending",
      submitted_by: "discover-pipeline",
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
