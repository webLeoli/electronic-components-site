import prisma from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

export default async function robots() {
  let customContent = null;

  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'robots_txt' },
    });
    if (setting && setting.value) {
      customContent = setting.value;
    }
  } catch (e) {
    // If DB fails, fallback to default
  }

  // If admin has set a custom robots.txt, parse it into the Next.js format
  // Otherwise use the default structured config
  if (customContent) {
    // Return as plain text response for custom content
    return new Response(customContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/search',
          '/*?*sort=',      // Sort variations = duplicate content
          '/*?*order=',     // Order variations = duplicate content
          '/*?*status=',    // Lifecycle filter = low SEO value
          '/*?*mount=',     // Mount filter = low SEO value
          '/*?*stock=',     // Stock filter = low SEO value
          '/*?*page=',      // Pagination pages = thin content
          // NOTE: ?mfr= is intentionally ALLOWED — manufacturer×category
          // pages are high-value SEO landing pages
        ],
      },
      {
        userAgent: 'AhrefsBot',
        crawlDelay: 10,
      },
      {
        userAgent: 'SemrushBot',
        crawlDelay: 10,
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
      {
        userAgent: 'DotBot',
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
