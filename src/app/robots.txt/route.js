import prisma from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const DEFAULT_ROBOTS = `User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /search
Disallow: /*?*sort=
Disallow: /*?*order=
Disallow: /*?*status=
Disallow: /*?*mount=
Disallow: /*?*stock=
Crawl-delay: 2

User-Agent: AhrefsBot
Crawl-delay: 10

User-Agent: SemrushBot
Crawl-delay: 10

User-Agent: MJ12bot
Disallow: /

User-Agent: DotBot
Disallow: /

Sitemap: ${SITE_URL}/sitemap.xml`;

export async function GET() {
  let content = DEFAULT_ROBOTS;

  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'robots_txt' },
    });

    if (setting && setting.value && setting.value.trim()) {
      content = setting.value;
    }
  } catch (e) {
    // DB error — use default
  }

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
