/**
 * seed-shops.ts — bulk-insert shops from a CSV/JSON file into Supabase as `pending`.
 *
 * Usage:
 *   npx tsx scripts/seed-shops.ts shops.json
 *
 * Input format (JSON array):
 * [
 *   {
 *     "name": "Jane's Style Picks",
 *     "shop_url": "https://www.amazon.com/shop/janestyle",
 *     "platform": "amazon",
 *     "category": "fashion",
 *     "description": "Fashion finds curated by Jane"
 *   }
 * ]
 *
 * Each shop is inserted as `status: 'pending'` so you can review in /admin.
 * Duplicate shop_urls are skipped (upsert on shop_url).
 *
 * Requires:
 *   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (or .env file).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx scripts/seed-shops.ts <shops.json>");
  process.exit(1);
}

interface ShopInput {
  name: string;
  shop_url: string;
  platform: "tiktok" | "instagram" | "youtube" | "pinterest" | "amazon";
  category: string;
  description?: string;
  followers?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const raw = readFileSync(filePath, "utf-8");
  const shops: ShopInput[] = JSON.parse(raw);

  console.log(`Loaded ${shops.length} shops from ${filePath}`);

  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const shop of shops) {
    const slug = slugify(shop.name);

    // Check if already exists by shop_url or slug
    const { data: existing } = await supabase
      .from("shops")
      .select("id")
      .or(`shop_url.eq.${shop.shop_url},slug.eq.${slug}`)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("shops").insert({
      name: shop.name,
      slug,
      shop_url: shop.shop_url,
      platform: shop.platform,
      category: shop.category,
      description: shop.description ?? null,
      followers: shop.followers ?? null,
      status: "pending",
      submitted_by: "seed-script",
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

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped (duplicates), ${errors} errors.`);
  console.log("All shops inserted as 'pending' — review them at /admin.");
}

main();
