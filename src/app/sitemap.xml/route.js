import { generateSitemaps } from '@/lib/sitemap-data';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sitemaps = await generateSitemaps();
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
