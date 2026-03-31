# Pick Your Shop — Project Instructions

## What This Is
A creator shop discovery platform — users browse, search, and review shops from TikTok, Amazon, Instagram, YouTube, and Pinterest. Think "Product Hunt for creator shops."

**Live site:** https://pickyour.shop

## Stack
- **Framework:** Astro 6 (hybrid rendering — static by default, SSR opt-in)
- **UI:** React 19 (islands via `client:only="react"`), Tailwind CSS 4
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Hosting:** Cloudflare Pages (static routes) + Cloudflare Workers (SSR routes)
- **Auth:** Supabase Auth (used for admin + reviews)

## Key Architecture Decisions
- Pages with `export const prerender = false` run as Cloudflare Workers at the edge (SSR)
- Pages without that export are statically pre-rendered at build time
- Supabase client uses `cloudflare:workers` env binding at runtime, `import.meta.env` at build time
- **Astro v6 env access rules:**
  - `.astro` files: `import { env } from 'cloudflare:workers'` for plaintext vars
  - `.ts` API routes — plaintext vars: `import { env } from 'cloudflare:workers'`
  - `.ts` API routes — **secrets**: `import { getSecret } from 'astro:env/server'` ← this is the ONLY way secrets work
  - `locals.runtime.env` was removed in Astro v6 — do not use
  - **Cloudflare secret gotcha:** If a secret isn't being read, delete and re-add it in the Cloudflare dashboard. Cloudflare doesn't always bind secrets to the Worker until they are re-saved after the deployment is live.
- Blog uses Astro Content Collections (Markdown files in `src/content/blog/`)
- Affiliate links route through `/go/[slug]` which rewrites URLs with affiliate tags

## Database Schema (Supabase)

### `shops` table
| Column       | Type     | Notes                                    |
|-------------|----------|------------------------------------------|
| id          | uuid     | Primary key                              |
| created_at  | timestamptz | Auto-generated                        |
| name        | text     | Display name                             |
| slug        | text     | URL-safe identifier (unique)             |
| platform    | text     | `tiktok`, `instagram`, `youtube`, `pinterest`, `amazon` |
| category    | text     | `fashion`, `beauty`, `tech`, `home`, `food-drink`, `fitness` |
| description | text     | Nullable                                 |
| shop_url    | text     | External shop URL                        |
| followers   | text     | Nullable, free-text                      |
| status      | text     | `pending`, `approved`, `rejected`        |
| submitted_by| text     | Nullable                                 |
| clicks      | integer  | Incremented by `/go/[slug]` redirect     |
| avg_rating  | numeric  | Computed from reviews                    |
| review_count| integer  | Computed from reviews                    |

### `reviews` table
Used for star ratings and text reviews on shop detail pages.

## Environment Variables
- `PUBLIC_SUPABASE_URL` — Safe to commit (in wrangler.toml)
- `PUBLIC_SUPABASE_ANON_KEY` — Safe to commit (RLS handles security)
- `SUPABASE_SERVICE_ROLE_KEY` — **Secret**, Cloudflare dashboard only, used by admin routes
- `ADMIN_PASSWORD` — **Secret**, Cloudflare dashboard only

## File Structure
```
src/
├── components/     — React (.tsx) and Astro (.astro) components
├── content/blog/   — Markdown blog posts
├── layouts/        — BaseLayout.astro (head, nav, footer)
├── lib/
│   ├── types.ts    — Shop interface, platform display names/colours
│   ├── supabase.ts — Supabase client factory
│   └── affiliate.ts— Affiliate link rewriting per platform
├── pages/          — File-based routing
└── styles/         — Global CSS
```

## Design System
- **Primary:** violet-600 (`#7c3aed`) — CTAs, links, active states, brand
- **Accent:** amber-500 — trending badges, secondary CTAs
- **Neutral:** slate-600/900 — body text, headings
- **Cards:** white bg, shadow-sm, violet left border accent, hover lift
- **Nav:** sticky, backdrop-blur, frosted glass effect

## Deployment
- Push to main → Cloudflare Pages auto-builds and deploys
- Build command: `npm run build` (runs `astro build`)
- Workers runtime: Node compat mode via Cloudflare adapter
- `_redirects` file: **Do not use absolute URLs** — Workers only supports relative URLs (error code 10021)

## Commands
```bash
npm run dev       # Local dev server (uses miniflare for Workers emulation)
npm run build     # Production build
npm run preview   # Preview production build locally
```

## SEO
- JSON-LD structured data on shop pages (Store + AggregateRating + BreadcrumbList)
- JSON-LD on blog posts (BlogPosting with author/publisher)
- JSON-LD on homepage (WebSite with SearchAction)
- OG image with width/height meta tags for Facebook
- Sitemap auto-generated via @astrojs/sitemap
- RSS feed at /rss.xml

## Monetisation
- Affiliate redirect through `/go/[slug]` — rewrites URLs with affiliate tags
- Amazon: `?tag=findyourshop-21`
- TikTok: `?affiliate_id=7130832`
- Other platforms: pass-through (no affiliate program yet)
