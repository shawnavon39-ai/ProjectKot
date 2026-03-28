/*
  Supabase client factory.

  On Cloudflare Workers (Astro v6), env vars are accessed via:
    import { env } from "cloudflare:workers"
  NOT import.meta.env (which is only available at build time).

  We export a factory so each page can pass the env object.
  The fallback to import.meta.env supports local dev and client-side.
*/
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getSupabase(cfEnv?: Record<string, any>): SupabaseClient {
  const url = cfEnv?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const key = cfEnv?.PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}
