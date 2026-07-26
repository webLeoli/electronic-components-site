import { unstable_cache } from 'next/cache';
import { generateSitemaps } from '@/lib/sitemap-data';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

// The index requires several aggregate queries (counts + latest-updated rows).
// Crawlers fetch sitemaps aggressively, so serve from a 6h server-side cache
// instead of hitting Postgres per request.
const getCachedSitemaps = unstable_cache(
  () => generateSitemaps(),
  ['sitemap-index'],
  { revalidate: 21600, tags: ['sitemap'] }
);

export async function GET() {
  const sitemaps = await getCachedSitemaps();
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemaps.map(({ id, lastModified }) =>
      `  <sitemap>\n` +
      `    <loc>${SITE_URL}/sitemap/${id}.xml</loc>\n` +
      (lastModified ? `    <lastmod>${lastModified}</lastmod>\n` : '') +
      `  </sitemap>`
    ).join('\n') +
    `\n</sitemapindex>\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
