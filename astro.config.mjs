// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  /*
    Astro v6: static is the default output mode, but any page can opt out
    of pre-rendering with `export const prerender = false`.
    Those pages run on a server at request time (like Next.js getServerSideProps).

    The adapter tells Astro what server runtime to use for those pages.
    We use Node for local dev — swap to Cloudflare adapter for deployment.
  */
  adapter: node({ mode: 'standalone' }),

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});