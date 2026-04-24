import prisma from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Prevent crawl-budget waste on parameterized URLs
# Sorting, filtering, and pagination generate near-infinite URL combinations
Disallow: /search
Disallow: /*?*sort=
Disallow: /*?*order=
Disallow: /*?*status=
Disallow: /*?*mount=
Disallow: /*?*page=

# Block common bad bots
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

Sitemap: ${SITE_URL}/sitemap.xml`;

export async function GET() {
  let content = DEFAULT_ROBOTS;

  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'robots_txt' },
    });
    if (setting && setting.value) {
      content = setting.value;
    }
  } catch (e) {
    // If DB fails, fallback to default
  }

  // Ensure content type is text/plain so crawlers parse it correctly
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
