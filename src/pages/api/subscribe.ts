export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  let email: string;

  try {
    const body = await request.json();
    email = (body.email ?? '').trim().toLowerCase();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), { status: 400 });
  }

  const apiKey = (env as any).BUTTONDOWN_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503 });
  }

  const res = await fetch('https://api.buttondown.email/v1/subscribers', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  // 201 = subscribed, 200 = already subscribed — both are fine
  if (res.status === 201 || res.status === 200) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  // 409 = already a subscriber
  if (res.status === 409) {
    return new Response(JSON.stringify({ error: 'already_subscribed' }), { status: 409 });
  }

  return new Response(JSON.stringify({ error: 'Subscription failed' }), { status: 500 });
};
