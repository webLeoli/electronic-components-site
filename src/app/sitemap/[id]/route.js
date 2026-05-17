import { getSitemapEntries, STATIC_CONTENT_DATE } from '@/lib/sitemap-data';

export const dynamic = 'force-dynamic';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(value) {
  if (!value) return STATIC_CONTENT_DATE;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? STATIC_CONTENT_DATE : date.toISOString();
}

export async function GET(_request, { params }) {
  const { id } = await params;
  const entries = await getSitemapEntries(id);

  if (entries.length === 0) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>\n`,
      {
        status: 404,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.map(entry => [
      '  <url>',
      `    <loc>${escapeXml(entry.url)}</loc>`,
      `    <lastmod>${formatDate(entry.lastModified)}</lastmod>`,
      `    <changefreq>${escapeXml(entry.changeFrequency || 'monthly')}</changefreq>`,
      `    <priority>${entry.priority ?? 0.5}</priority>`,
      '  </url>',
    ].join('\n')).join('\n') +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
