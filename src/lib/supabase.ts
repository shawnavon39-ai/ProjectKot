/*
  Supabase client — single instance shared across the app.

  In React you'd usually set this up in a context provider.
  In Astro, since .astro files run at build/server time, you just
  import this directly — no provider wrapper needed.

  For client-side React islands (client:load components), you'd
  import this same client. Supabase JS works in both environments.
*/
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/*
  PUBLIC_ prefix is Astro's equivalent of NEXT_PUBLIC_ in Next.js
  or VITE_ in Vite. It means "safe to expose to the browser".
  The anon key is designed to be public — Row Level Security (RLS)
  in Supabase handles the actual access control.
*/
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
