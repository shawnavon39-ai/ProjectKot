/*
  Supabase client factory.

  On Cloudflare Workers, environment variables aren't available via
  import.meta.env at runtime — they come through the Worker's env
  bindings. Astro's Cloudflare adapter exposes them via
  Astro.locals.runtime.env.

  So instead of creating a singleton at module scope (which would crash
  because the env vars don't exist yet), we export a factory function.
  Each page calls getSupabase() with the runtime env.

  This is a common pattern in serverless/edge: you can't rely on
  module-level initialization because the execution context (and its
  env vars) only exists inside the request handler.
*/
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type RuntimeEnv = Record<string, string>;

export function getSupabase(runtimeEnv?: RuntimeEnv): SupabaseClient {
  const url = runtimeEnv?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const key = runtimeEnv?.PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}
