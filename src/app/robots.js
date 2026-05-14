import prisma from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

// ISR — re-check DB every 60 seconds so admin changes take effect
export const revalidate = 60;

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

  // If admin has set a custom robots.txt, validate and use it.
  // SAFETY: Reject if it contains a blanket "Disallow: /" — that kills the entire site.
  // A single DB typo or bad migration should never be able to de-index everything.
  if (customContent) {
    const hasBlanketBlock = customContent
      .split('\n')
      .some(line => /^\s*Disallow:\s*\/\s*$/i.test(line));

    if (hasBlanketBlock) {
      console.error(
        '[robots.txt] BLOCKED: Custom robots.txt from DB contains "Disallow: /" which would block the entire site. Falling back to default rules. Fix the AdminSetting record with key "robots_txt".'
      );
      // Fall through to default rules below
    } else {
      return new Response(customContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }
  }

  return {
    rules: [
      {
        // NOTE: * wildcard in Disallow is supported by Google, Bing, Yandex
        // (the vast majority of search traffic). RFC 9309-compliant crawlers
        // interpret * literally, so these patterns only work for major engines.
        // Non-Google dedup is handled via <link rel="canonical"> on each page.
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/search',          // Search results — noindex via meta robots
          '/*?*sort=',        // Sort variations → canonical to base
          '/*?*order=',
          '/*?*status=',      // Lifecycle filter → canonical to base
          '/*?*mount=',       // Mount filter → canonical to base
          '/*?*stock=',
          // NOTE: ?page= is intentionally ALLOWED — pagination contains
          // unique product links that crawlers need to discover.
          // NOTE: ?mfr= is intentionally ALLOWED — manufacturer×category
          // pages are high-value SEO landing pages.
        ],
        crawlDelay: 2,
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
