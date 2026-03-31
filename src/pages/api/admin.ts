export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createClient } from '@supabase/supabase-js';

const ADMIN_USER_IDS = [
  'd61a80e6-eb10-46d2-b9ff-8da51b93b98a',
  '5b572ba1-910e-429e-818d-f1d6460eb54e',
];

function getAdminClient() {
  const supabaseUrl = (env as any).PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceRoleKey = (env as any).SUPABASE_SERVICE_ROLE_KEY ?? import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, serviceRoleKey);
}

async function verifyAdmin(request: Request): Promise<boolean> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return false;
  const supabase = getAdminClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  return !!user && ADMIN_USER_IDS.includes(user.id);
}

const unauthorized = () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

export const GET: APIRoute = async ({ request }) => {
  if (!await verifyAdmin(request)) return unauthorized();

  const supabase = getAdminClient();

  const [
    { data: pendingShops },
    { data: pendingReviews },
    { data: approvedShops },
    { count: approvedCount },
    { count: pendingCount },
    { data: products },
  ] = await Promise.all([
    supabase.from('shops').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
    supabase.from('reviews').select('*, shops(name)').eq('status', 'pending').order('created_at', { ascending: true }),
    supabase.from('shops').select('id, name, slug, platform, verified, followers').eq('status', 'approved').order('name'),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('*, shop:shops(name)').order('created_at', { ascending: false }),
  ]);

  return new Response(JSON.stringify({
    pendingShops: pendingShops ?? [],
    pendingReviews: pendingReviews ?? [],
    approvedShops: approvedShops ?? [],
    products: products ?? [],
    approvedCount: approvedCount ?? 0,
    pendingCount: pendingCount ?? 0,
  }), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  if (!await verifyAdmin(request)) return unauthorized();

  const supabase = getAdminClient();
  const body = await request.json();
  const { action } = body;

  if (action === 'approve') {
    const { data: shop } = await supabase.from('shops').select('followers').eq('id', body.shopId).single();
    const autoVerify = !!(shop?.followers?.trim());
    const { error } = await supabase.from('shops').update({ status: 'approved', verified: autoVerify }).eq('id', body.shopId);
    return new Response(JSON.stringify({ error: error?.message, autoVerified: autoVerify }), { status: error ? 500 : 200 });
  }

  if (action === 'reject') {
    const { error } = await supabase.from('shops').update({ status: 'rejected' }).eq('id', body.shopId);
    return new Response(JSON.stringify({ error: error?.message }), { status: error ? 500 : 200 });
  }

  if (action === 'toggle_verified') {
    const { error } = await supabase.from('shops').update({ verified: body.verified }).eq('id', body.shopId);
    return new Response(JSON.stringify({ error: error?.message }), { status: error ? 500 : 200 });
  }

  if (action === 'approve_review') {
    const { error } = await supabase.from('reviews').update({ status: 'approved' }).eq('id', body.reviewId);
    return new Response(JSON.stringify({ error: error?.message }), { status: error ? 500 : 200 });
  }

  if (action === 'reject_review') {
    const { error } = await supabase.from('reviews').update({ status: 'rejected' }).eq('id', body.reviewId);
    return new Response(JSON.stringify({ error: error?.message }), { status: error ? 500 : 200 });
  }

  if (action === 'add_product') {
    const { error } = await supabase.from('products').insert({
      shop_id: body.shopId,
      name: body.name,
      price: body.price || null,
      original_price: body.originalPrice || null,
      image_url: body.imageUrl || null,
      product_url: body.productUrl,
      on_sale: body.onSale ?? false,
    });
    return new Response(JSON.stringify({ error: error?.message }), { status: error ? 500 : 200 });
  }

  if (action === 'delete_product') {
    const { error } = await supabase.from('products').delete().eq('id', body.productId);
    return new Response(JSON.stringify({ error: error?.message }), { status: error ? 500 : 200 });
  }

  if (action === 'toggle_product_sale') {
    const { error } = await supabase.from('products').update({ on_sale: body.onSale }).eq('id', body.productId);
    return new Response(JSON.stringify({ error: error?.message }), { status: error ? 500 : 200 });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
};
