/*
  SearchBar.tsx — React island for live shop search.

  Uses Supabase's ilike for simple text matching across
  shop name, description, and category fields.

  This is a client:only component (no SSR) because it needs
  the Supabase client which relies on import.meta.env in the browser.
*/
import { useState, useRef, useEffect } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface ShopResult {
  name: string;
  slug: string;
  platform: string;
  category: string;
  description: string | null;
}

const platformNames: Record<string, string> = {
  tiktok: 'TikTok Shop',
  instagram: 'Instagram Shopping',
  youtube: 'YouTube Shopping',
  pinterest: 'Pinterest Shopping',
  amazon: 'Amazon Influencer',
};

function getSupabase() {
  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default function SearchBar() {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (!supabaseRef.current) supabaseRef.current = getSupabase();
  const supabase = supabaseRef.current;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShopResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const searchTerm = `%${value.trim()}%`;

      const { data } = await supabase
        .from('shops')
        .select('name, slug, platform, category, description')
        .eq('status', 'approved')
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .limit(8);

      setResults((data ?? []) as ShopResult[]);
      setOpen(true);
      setLoading(false);
    }, 300);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder="Search shops, creators, or categories..."
        className="w-full px-5 py-3.5 rounded-xl border border-slate-200 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
      />

      {loading && (
        <div className="absolute right-4 top-4 text-slate-400 text-sm">
          Searching...
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-96 overflow-y-auto">
          {results.map(shop => (
            <a
              key={shop.slug}
              href={`/shops/${shop.slug}`}
              className="block px-4 py-3 hover:bg-violet-50 border-b border-slate-100 last:border-0 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{shop.name}</span>
                <span className="text-xs text-slate-500">{platformNames[shop.platform] ?? shop.platform}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {shop.category}
                {shop.description && ` · ${shop.description.slice(0, 60)}${shop.description.length > 60 ? '...' : ''}`}
              </div>
            </a>
          ))}
        </div>
      )}

      {open && query.trim().length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center text-sm text-slate-500">
          No shops found for "{query}".
          <a href="/submit" className="block mt-1 text-violet-600 hover:underline font-medium">Submit a shop →</a>
        </div>
      )}
    </div>
  );
}
