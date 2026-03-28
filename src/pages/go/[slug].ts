/*
  /go/[slug] — affiliate redirect endpoint.

  This is a SERVER-RENDERED route (prerender = false), meaning it runs
  per request rather than at build time. In Astro, this is like an
  Express route handler or a Next.js API route.

  Why redirect through our own URL instead of linking directly?
    1. We can inject affiliate tags without exposing them in the HTML
    2. We can track clicks (add analytics later without rebuilding)
    3. We can swap affiliate IDs instantly — no rebuild needed
    4. If a shop URL changes, we update the DB, not cached HTML

  This pattern is called a "redirect-through" or "outbound link proxy".
  Most affiliate sites (Wirecutter, etc.) use exactly this approach.
*/
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { getAffiliateUrl } from '../../lib/affiliate';
import type { Shop } from '../../lib/types';

export const prerender = false;

export const GET: APIRoute = async ({ params, redirect }) => {
  const { slug } = params;

  const { data } = await supabase
    .from('shops')
    .select('shop_url, platform')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (!data) {
    return redirect('/shops', 307);
  }

  const shop = data as Pick<Shop, 'shop_url' | 'platform'>;
  const affiliateUrl = getAffiliateUrl(shop.platform, shop.shop_url);

  /*
    302 (temporary redirect) is intentional — not 301 (permanent).
    301 gets cached by browsers forever. If we change the affiliate tag
    or the shop URL, a 301 would keep sending users to the old destination.
    302 means "check with us every time", which is what we want.
  */
  return redirect(affiliateUrl, 302);
};
