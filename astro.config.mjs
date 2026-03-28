// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  /*
    Astro v6: static is the default output mode, but any page can opt out
    of pre-rendering with `export const prerender = false`.
    Those pages run on a server at request time (like Next.js getServerSideProps).

    The adapter tells Astro what server runtime to use for those pages.
    Cloudflare Pages runs server-rendered routes as Cloudflare Workers
    (edge functions) — fast, globally distributed, free tier generous.
  */
  adapter: cloudflare(),

  // Update this to your actual domain once it's live
  site: 'https://kot.example.com',

  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()]
  }
});