export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { getSecret } from 'astro:env/server';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, locals }) => {
  const formData = await request.formData();

  const shop_name = (formData.get('shop_name') as string ?? '').trim();
  const product_name = (formData.get('product_name') as string ?? '').trim();
  const product_url = (formData.get('product_url') as string ?? '').trim();
  const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null;
  const original_price = formData.get('original_price') ? parseFloat(formData.get('original_price') as string) : null;
  const image_url = (formData.get('image_url') as string ?? '').trim() || null;
  const notes = (formData.get('notes') as string ?? '').trim() || null;
  const submitter_email = (formData.get('submitter_email') as string ?? '').trim() || null;

  if (!shop_name || !product_name || !product_url) {
    return new Response('Missing required fields', { status: 400 });
  }

  const cfEnv = (locals as any)?.cfContext?.env ?? {};
  const supabaseUrl = getSecret('PUBLIC_SUPABASE_URL') ?? cfEnv.PUBLIC_SUPABASE_URL ?? (env as any).PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getSecret('SUPABASE_SERVICE_ROLE_KEY') ?? cfEnv.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = getSecret('PUBLIC_SUPABASE_ANON_KEY') ?? cfEnv.PUBLIC_SUPABASE_ANON_KEY ?? (env as any).PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, anonKey);

  const { error } = await supabase.from('deal_submissions').insert({
    shop_name,
    product_name,
    product_url,
    price: price || null,
    original_price: original_price || null,
    image_url,
    notes,
    submitter_email,
  });

  if (error) {
    return new Response('Submission failed', { status: 500 });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: '/submit-deal?submitted=1' },
  });
};
