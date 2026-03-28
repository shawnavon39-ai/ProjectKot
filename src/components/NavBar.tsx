/*
  NavBar.tsx — React island for the navigation bar.

  This REPLACES the static <nav> in BaseLayout.astro.
  It needs to be a React component because:
    1. It checks auth state (async, runs in browser)
    2. It re-renders when auth state changes (sign in/out)

  Supabase's onAuthStateChange listener fires whenever the user
  signs in, signs out, or their token refreshes. We use it to
  keep the nav in sync without page reloads.

  This is similar to how you'd use onAuthStateChanged in Firebase,
  or a useContext provider for auth in a React SPA.
*/
import { useState, useEffect, useRef } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default function NavBar() {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (!supabaseRef.current) supabaseRef.current = getSupabase();
  const supabase = supabaseRef.current;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const displayName = user?.user_metadata?.display_name;

  return (
    <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/" className="text-xl font-bold tracking-tight">KOT</a>

      <div className="flex items-center gap-4">
        <a href="/shops" className="text-sm text-gray-600 hover:text-gray-900">Browse Shops</a>
        <a href="/submit" className="text-sm text-gray-600 hover:text-gray-900">Submit a Shop</a>

        {!loading && (
          user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 font-medium">
                {displayName || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Sign in
            </a>
          )
        )}
      </div>
    </nav>
  );
}
