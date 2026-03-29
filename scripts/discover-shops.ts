/**
 * discover-shops.ts — automated pipeline to find and seed Amazon Influencer storefronts.
 *
 * Uses Google Custom Search API to discover amazon.com/shop/ pages,
 * then gently scrapes each storefront for name/description,
 * and inserts them as `pending` into Supabase.
 *
 * Usage:
 *   npx tsx scripts/discover-shops.ts
 *
 * Optional flags:
 *   --dry-run     Output JSON without inserting into Supabase
 *   --category    Override search category (e.g. --category beauty)
 *   --max-pages   Max search result pages per query (default: 3, max 10)
 *
 * Env vars required:
 *   GOOGLE_CSE_ID          — Custom Search Engine ID
 *   GOOGLE_CSE_API_KEY     — Google Cloud API key
 *   SUPABASE_URL           — or PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Rate limits:
 *   - Google CSE free tier: 100 queries/day (each page = 1 query)
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

const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY;
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const categoryOverride = args.find((a) => a.startsWith("--category="))?.split("=")[1];
const maxPages = Math.min(
  parseInt(args.find((a) => a.startsWith("--max-pages="))?.split("=")[1] ?? "3"),
  10
);

// Search queries — each targets a different category
const SEARCH_QUERIES = [
  { query: "amazon.com/shop fashion style outfit", category: "fashion" },
  { query: "amazon.com/shop beauty makeup skincare", category: "beauty" },
  { query: "amazon.com/shop tech gadgets electronics", category: "tech" },
  { query: "amazon.com/shop home decor kitchen", category: "home" },
  { query: "amazon.com/shop fitness gym workout", category: "fitness" },
  { query: "amazon.com/shop food cooking kitchen essentials", category: "food-drink" },
];

// Path to track previously seen URLs so we don't re-process them
const SEEN_FILE = "scripts/.discovered-urls.json";

// Category keywords for refining auto-classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  fashion: ["fashion", "style", "outfit", "clothing", "dress", "shoes", "wear", "wardrobe"],
  beauty: ["beauty", "makeup", "skincare", "cosmetic", "hair", "glow"],
  tech: ["tech", "gadget", "electronic", "computer", "phone", "gaming", "desk"],
  home: ["home", "decor", "kitchen", "furniture", "organization", "cozy", "house"],
  fitness: ["fitness", "gym", "workout", "health", "protein", "exercise", "yoga"],
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
  const match = url.match(
    /amazon\.[a-z.]+\/shop\/([a-zA-Z0-9_-]+)/
  );
  if (!match) return null;
  const handle = match[1].toLowerCase();
  // Filter out generic Amazon pages
  if (["shop", "b", "s", "dp", "gp"].includes(handle)) return null;
  return handle;
}

// ---------------------------------------------------------------------------
// Google Custom Search
// ---------------------------------------------------------------------------

interface SearchResult {
  link: string;
  title: string;
  snippet: string;
}

async function searchGoogle(
  query: string,
  startIndex: number = 1
): Promise<SearchResult[]> {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_CSE_API_KEY!);
  url.searchParams.set("cx", GOOGLE_CSE_ID!);
  url.searchParams.set("q", query);
  url.searchParams.set("start", String(startIndex));
  url.searchParams.set("num", "10");

  const res = await fetch(url.toString());

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) {
      console.error("  Google API daily limit reached. Try again tomorrow.");
      return [];
    }
    console.error(`  Google API error ${res.status}: ${body.slice(0, 200)}`);
    return [];
  }

  const data = await res.json();
  return (data.items ?? []).map((item: any) => ({
    link: item.link,
    title: item.title ?? "",
    snippet: item.snippet ?? "",
  }));
}

// ---------------------------------------------------------------------------
// Amazon Storefront Scraper
// ---------------------------------------------------------------------------

interface ShopData {
  name: string;
  shop_url: string;
  platform: "amazon";
  category: string;
  description: string;
  handle: string;
}

async function scrapeStorefront(
  handle: string,
  fallbackCategory: string,
  searchTitle: string,
  searchSnippet: string
): Promise<ShopData | null> {
  const url = `https://www.amazon.com/shop/${handle}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      // Don't log 404s — just means the storefront doesn't exist
      if (res.status !== 404) {
        console.error(`    ${handle}: HTTP ${res.status}`);
      }
      return null;
    }

    const html = await res.text();

    // Extract name from page title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const rawTitle = titleMatch?.[1] ?? "";
    let name = rawTitle
      .replace(/\s*[\|–—].*$/, "")
      .replace(/['']s\s+(Store|Storefront|Shop).*$/i, "")
      .replace(/\s+(Store|Storefront|Shop).*$/i, "")
      .replace(/Amazon\.com:\s*/i, "")
      .trim();

    // Fall back to search title or handle
    if (!name || name.length < 2) {
      name = searchTitle
        .replace(/\s*[\|–—].*$/, "")
        .replace(/Amazon\.com:\s*/i, "")
        .trim() || handle;
    }

    // Extract description from meta tag
    const descMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
    );
    const description =
      descMatch?.[1]?.trim() ||
      searchSnippet.slice(0, 150).trim() ||
      `${name}'s curated picks on Amazon`;

    const category = refineCategory(
      `${name} ${description} ${searchTitle} ${searchSnippet}`,
      fallbackCategory
    );

    return {
      name,
      shop_url: url,
      platform: "amazon",
      category,
      description,
      handle,
    };
  } catch (err) {
    console.error(
      `    ${handle}: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Validate env
  if (!GOOGLE_CSE_ID || !GOOGLE_CSE_API_KEY) {
    console.error("Missing GOOGLE_CSE_ID or GOOGLE_CSE_API_KEY env vars.");
    console.error("\nSetup:");
    console.error("1. Go to programmablesearchengine.google.com");
    console.error("2. Create a search engine scoped to amazon.com/shop/*");
    console.error("3. Get your Search Engine ID and API Key");
    console.error("4. Set GOOGLE_CSE_ID and GOOGLE_CSE_API_KEY in your .env");
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
  let googleQueries = 0;

  console.log(
    `Starting discovery (${queries.length} categories, ${maxPages} pages each)${DRY_RUN ? " [DRY RUN]" : ""}\n`
  );

  for (const { query, category } of queries) {
    console.log(`Searching: ${category}`);

    for (let page = 0; page < maxPages; page++) {
      const startIndex = page * 10 + 1;
      const results = await searchGoogle(query, startIndex);
      googleQueries++;

      if (results.length === 0) break;

      for (const result of results) {
        const handle = extractHandle(result.link);
        if (!handle) continue;

        const shopUrl = `https://www.amazon.com/shop/${handle}`;
        if (seenUrls.has(shopUrl)) continue;

        seenUrls.add(shopUrl);

        console.log(`  Found: ${handle}`);
        await sleep(2000); // Gentle delay

        const shop = await scrapeStorefront(
          handle,
          category,
          result.title,
          result.snippet
        );

        if (shop) {
          discovered.push(shop);
          console.log(`    ✓ ${shop.name} (${shop.category})`);
        }
      }

      // Pause between search pages
      await sleep(1000);
    }
  }

  console.log(
    `\nDiscovered ${discovered.length} new shops (used ${googleQueries} Google API queries)`
  );

  // Save seen URLs for next run
  saveSeenUrls(seenUrls);

  if (discovered.length === 0) {
    console.log("No new shops found. Try again tomorrow for fresh results.");
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
