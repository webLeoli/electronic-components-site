import { getSitemapEntries } from '@/lib/sitemap-data';

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
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export async function GET(_request, { params }) {
  const { id } = await params;
  const entries = await getSitemapEntries(id);
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
