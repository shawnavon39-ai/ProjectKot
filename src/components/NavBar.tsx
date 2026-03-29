import { useState, useEffect, useRef } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

interface Props {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export default function NavBar({ supabaseUrl, supabaseAnonKey }: Props) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (!supabaseRef.current) supabaseRef.current = createClient(supabaseUrl, supabaseAnonKey);
  const supabase = supabaseRef.current;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

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
    <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600 text-white text-sm font-bold">P</span>
        <span>Pick Your Shop</span>
      </a>

      {/* Mobile menu button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="sm:hidden p-2 text-slate-600 hover:text-slate-900"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {menuOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* Desktop nav */}
      <div className="hidden sm:flex items-center gap-5">
        <a href="/shops" className="text-sm text-slate-700 hover:text-violet-600 transition font-semibold">Browse Shops</a>
        <a href="/blog" className="text-sm text-slate-700 hover:text-violet-600 transition font-semibold">Blog</a>
        <a
          href="/submit"
          className="text-sm px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
        >
          List Your Shop
        </a>

        {!loading && (
          user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-700 font-medium">
                {displayName || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-slate-500 hover:text-slate-900 transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 transition font-medium"
            >
              Sign in
            </a>
          )
        )}
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg sm:hidden z-50">
          <div className="flex flex-col px-4 py-3 gap-3">
            <a href="/shops" className="text-sm text-slate-700 font-medium py-1">Browse</a>
            <a href="/blog" className="text-sm text-slate-700 font-medium py-1">Blog</a>
            <a
              href="/submit"
              className="text-sm px-4 py-2 bg-violet-600 text-white rounded-lg font-medium text-center"
            >
              List Your Shop
            </a>
            {!loading && (
              user ? (
                <button
                  onClick={handleSignOut}
                  className="text-sm text-slate-500 hover:text-slate-900 text-left py-1"
                >
                  Sign out ({displayName || user.email})
                </button>
              ) : (
                <a href="/login" className="text-sm text-slate-700 font-medium py-1">Sign in</a>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
