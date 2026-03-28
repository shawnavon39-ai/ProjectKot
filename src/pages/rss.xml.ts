/*
  rss.xml.ts — RSS feed for the blog.

  Generates a standard RSS 2.0 feed at /rss.xml using @astrojs/rss.
  Feed readers (Feedly, Inoreader, etc.) and Google can auto-discover
  this via the <link rel="alternate" type="application/rss+xml"> tag
  in BaseLayout.

  Prerendered at build time — same as the blog itself.
*/
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export const prerender = true;

export async function GET(context: APIContext) {
  const posts = await getCollection('blog');

  return rss({
    title: 'Pick Your Shop — Blog',
    description: 'Roundups, guides, and tips for finding the best creator shops across TikTok, Amazon, Instagram, and more.',
    site: context.site!.toString(),
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map(post => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/blog/${post.id}`,
      })),
  });
}
