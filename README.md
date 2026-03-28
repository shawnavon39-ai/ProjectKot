# Project KOT

A multi-platform social commerce aggregator — discover shops, creators, and products across TikTok Shop, Instagram Shopping, YouTube Shopping, Pinterest, and Amazon Influencer stores in one place.

## Tech Stack

- **Framework:** [Astro](https://astro.build) with React islands
- **Styling:** Tailwind CSS v4
- **Auth + DB:** Supabase (PostgreSQL)
- **Hosting:** Cloudflare Pages
- **TypeScript:** Strict mode

## Getting Started

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # Production build → ./dist/
npm run preview    # Preview production build
```

## Project Structure

```
src/
├── components/     # React islands (interactive) + Astro components (static)
├── layouts/        # Page layouts (shared HTML shell)
├── pages/          # File-based routing (each .astro file = a route)
├── lib/            # Supabase client, utilities
└── styles/         # Global CSS (Tailwind)
```

## Platforms Covered (planned)

| Platform | Type |
|---|---|
| TikTok Shop | Social commerce |
| Instagram Shopping | Social commerce |
| YouTube Shopping | Social commerce |
| Pinterest Shopping | Social commerce |
| Amazon Influencer Stores | Affiliate marketplace |

## Status

MVP in development.
