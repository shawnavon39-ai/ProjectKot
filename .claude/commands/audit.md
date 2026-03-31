Run a full pre-launch audit on the Pick Your Shop site. Work through each step sequentially, fix any issues found, and commit after each fix.

## Steps

### 1. Build check
Run `npm run build` and capture any errors or warnings. Do not proceed if the build fails — fix errors first.

### 2. Route audit
- Glob all files under `src/pages/` to list every route
- Confirm `src/pages/404.astro` exists
- Confirm `src/pages/index.astro`, `/shops`, `/deals`, `/blog`, `/lists`, `/submit`, `/submit-deal` all exist

### 3. SEO scan
For each page, check that BaseLayout receives a meaningful `title` and `description` prop. Flag any pages passing empty strings or generic placeholders.

### 4. Analytics check
Search all files for analytics scripts — confirm there is exactly one Cloudflare Web Analytics setup (either auto via Cloudflare DNS or a single JS snippet). Flag duplicates.

### 5. Broken image check
Search component and page files for hardcoded image paths (`/images/`, `/img/`, `public/`). Verify those files exist in the `public/` directory.

### 6. Environment variable check
Grep for `import.meta.env`, `getSecret`, and `cloudflare:workers` usage. Confirm all required env vars are documented in CLAUDE.md.

### 7. Affiliate redirect check
Confirm `/go/[slug].ts` exists and that `src/lib/affiliate.ts` covers all platforms listed in `src/lib/types.ts`.

### 8. Report
Print a summary:
- ✅ for each passing check
- ⚠️ for warnings
- ❌ for failures

End with a GO / NO-GO recommendation.
