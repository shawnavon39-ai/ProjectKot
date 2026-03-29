/**
 * scrape-amazon-influencers.ts — discover Amazon Influencer storefronts.
 *
 * This scrapes publicly available Amazon Influencer pages and outputs
 * a JSON file compatible with seed-shops.ts.
 *
 * Usage:
 *   npx tsx scripts/scrape-amazon-influencers.ts
 *
 * How it works:
 *   1. Fetches a list of known Amazon Influencer pages (you populate the list)
 *   2. For each, extracts the storefront name and description from the page
 *   3. Outputs shops.json ready for seed-shops.ts
 *
 * IMPORTANT: This only scrapes publicly accessible pages. Amazon Influencer
 * storefronts at amazon.com/shop/{handle} are public web pages.
 * We only collect: name, public URL, and any visible description.
 * No private data, no login required, no rate-limit abuse.
 *
 * To find influencer handles:
 *   - Search Google: site:amazon.com/shop/ "fashion"
 *   - Browse Amazon's Influencer program discover page
 *   - Check social media bios for amazon.com/shop/ links
 */

import { writeFileSync } from "fs";

// Add influencer handles here (the part after amazon.com/shop/)
const INFLUENCER_HANDLES: string[] = [
  // Example — replace with real handles you find
  // "janestyle",
  // "techbroessentials",
];

// Category keywords to auto-classify shops
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  fashion: ["fashion", "style", "outfit", "clothing", "dress", "shoes", "wear"],
  beauty: ["beauty", "makeup", "skincare", "cosmetic", "hair"],
  tech: ["tech", "gadget", "electronic", "computer", "phone", "gaming"],
  home: ["home", "decor", "kitchen", "furniture", "organization", "cozy"],
  fitness: ["fitness", "gym", "workout", "health", "protein", "exercise"],
  "food-drink": ["food", "cook", "recipe", "drink", "kitchen", "bake"],
};

function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return "fashion"; // default
}

interface ShopOutput {
  name: string;
  shop_url: string;
  platform: string;
  category: string;
  description: string;
}

async function scrapeStorefront(handle: string): Promise<ShopOutput | null> {
  const url = `https://www.amazon.com/shop/${handle}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    if (!res.ok) {
      console.error(`  ${handle}: HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();

    // Extract storefront name from the page title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const rawTitle = titleMatch?.[1] ?? handle;
    // Clean up "Shop Name's ... | Amazon" format
    const name = rawTitle
      .replace(/\s*\|.*$/, "")
      .replace(/['']s\s+(Store|Storefront|Shop).*$/i, "")
      .replace(/\s+(Store|Storefront|Shop).*$/i, "")
      .trim() || handle;

    // Try to extract a description from meta tags
    const descMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
    );
    const description = descMatch?.[1]?.trim() ?? `${name}'s curated picks on Amazon`;

    const category = guessCategory(`${name} ${description}`);

    return {
      name,
      shop_url: url,
      platform: "amazon",
      category,
      description,
    };
  } catch (err) {
    console.error(`  ${handle}: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

async function main() {
  if (INFLUENCER_HANDLES.length === 0) {
    console.log("No handles configured yet.");
    console.log("\nTo get started:");
    console.log("1. Search Google for: site:amazon.com/shop/ fashion");
    console.log("2. Add the handles to INFLUENCER_HANDLES in this file");
    console.log("3. Run again: npx tsx scripts/scrape-amazon-influencers.ts");
    console.log("\nAlternatively, manually create a shops.json using shops-example.json as a template.");
    return;
  }

  console.log(`Scraping ${INFLUENCER_HANDLES.length} storefronts...`);
  const shops: ShopOutput[] = [];

  for (const handle of INFLUENCER_HANDLES) {
    console.log(`  Fetching ${handle}...`);
    const shop = await scrapeStorefront(handle);
    if (shop) {
      shops.push(shop);
      console.log(`    ✓ ${shop.name} (${shop.category})`);
    }
    // Be respectful — wait between requests
    await new Promise((r) => setTimeout(r, 1500));
  }

  const outPath = "scripts/scraped-shops.json";
  writeFileSync(outPath, JSON.stringify(shops, null, 2));
  console.log(`\nWrote ${shops.length} shops to ${outPath}`);
  console.log(`Next: review the file, then run: npx tsx scripts/seed-shops.ts ${outPath}`);
}

main();
