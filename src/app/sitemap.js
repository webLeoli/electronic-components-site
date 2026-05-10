import prisma from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

/**
 * Sitemap splitting strategy:
 *   id=0  → Static pages + Categories + Manufacturers + Blog + Custom
 *   id=1+ → Product pages in batches of 10,000
 *
 * Next.js automatically generates a sitemap index at /sitemap.xml
 * pointing to /sitemap/0.xml, /sitemap/1.xml, etc.
 */

const PRODUCTS_PER_SITEMAP = 5000;

/**
 * Generate sitemap index entries.
 * Next.js calls this to know how many sub-sitemaps to create.
 */
export async function generateSitemaps() {
  let productCount = 0;
  try {
    // Only count products marked as indexable by the quality scoring system
    productCount = await prisma.product.count({
      where: { indexable: true },
    });
  } catch {}

  // id=0 is static + categories + manufacturers + blog
  // id=1..N are product batches (only quality-gated products)
  const productSitemapCount = Math.max(1, Math.ceil(productCount / PRODUCTS_PER_SITEMAP));
  const ids = [{ id: 0 }];
  for (let i = 1; i <= productSitemapCount; i++) {
    ids.push({ id: i });
  }
  return ids;
}

export default async function sitemap({ id }) {
  // Sitemap 0: Static + Categories + Manufacturers + Blog + Custom
  if (id === 0) {
    const staticPages = [
      { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
      { url: `${SITE_URL}/category`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
      { url: `${SITE_URL}/manufacturers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
      { url: `${SITE_URL}/rfq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
      { url: `${SITE_URL}/bom`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
      { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
      { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${SITE_URL}/quality`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${SITE_URL}/shipping`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
      { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ];

    // Dynamic: Categories (flat URLs, priority by depth level)
    let categoryPages = [];
    try {
      const categories = await prisma.category.findMany({
        select: { id: true, slug: true, parentId: true },
      });
      // Build a lookup map for parentId → category
      const categoryById = new Map(categories.map(c => [c.id, c]));
      categoryPages = categories.map(cat => {
        // L1: no parent → 0.9, L2: parent is L1 → 0.85, L3: parent is L2 → 0.8
        let priority = 0.8;
        if (!cat.parentId) {
          priority = 0.9; // L1
        } else {
          const parent = categoryById.get(cat.parentId);
          priority = (parent && !parent.parentId) ? 0.85 : 0.8; // L2 vs L3
        }
        return {
          url: `${SITE_URL}/category/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority,
        };
      });
    } catch {}

    // Dynamic: Manufacturers
    let manufacturerPages = [];
    try {
      const manufacturers = await prisma.manufacturer.findMany({
        select: { slug: true },
      });
      manufacturerPages = manufacturers.map(m => ({
        url: `${SITE_URL}/manufacturer/${m.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    } catch {}

    // Dynamic: Blog Posts (published only)
    let blogPages = [];
    try {
      const posts = await prisma.blogPost.findMany({
        where: { status: 'published' },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
      });
      blogPages = posts.map(post => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      }));
    } catch {}

    // Manual Custom URLs from Admin SEO Panel
    let customPages = [];
    try {
      const setting = await prisma.adminSetting.findUnique({
        where: { key: 'sitemap_urls' }
      });
      if (setting && setting.value) {
        const rawUrls = setting.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        customPages = rawUrls.map(rawPath => ({
          url: rawPath.startsWith('http') ? rawPath : `${SITE_URL}${rawPath.startsWith('/') ? '' : '/'}${rawPath}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        }));
      }
    } catch {}

    return [
      ...staticPages,
      ...categoryPages,
      ...manufacturerPages,
      ...blogPages,
      ...customPages,
    ];
  }

  // Sitemap 1..N: Product pages batch
  // Only submit products marked as indexable by the quality scoring system.
  // Sort by qualityScore DESC so highest-quality pages are in earlier sitemaps.
  const numericId = typeof id === 'number' ? id : parseInt(id, 10);
  const batchIndex = numericId - 1;
  if (batchIndex < 0 || isNaN(batchIndex)) return [];
  let productPages = [];
  try {
    const products = await prisma.product.findMany({
      where: { indexable: true },
      select: { partNumber: true, updatedAt: true, qualityScore: true },
      orderBy: [{ qualityScore: 'desc' }, { id: 'asc' }],
      skip: batchIndex * PRODUCTS_PER_SITEMAP,
      take: PRODUCTS_PER_SITEMAP,
    });
    productPages = products.map(p => ({
      url: `${SITE_URL}/product/${encodeURIComponent(p.partNumber)}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: p.qualityScore >= 70 ? 'weekly' : 'monthly',
      priority: p.qualityScore >= 70 ? 0.8 : 0.6,
    }));
  } catch {}

  return productPages;
}
