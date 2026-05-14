import prisma from '@/lib/db';
import { productPath, SITE_URL } from '@/lib/seo';

export const PRODUCTS_PER_SITEMAP = 5000;

export async function generateSitemaps() {
  let productCount = 0;
  try {
    productCount = await prisma.product.count({
      where: { indexable: true },
    });
  } catch {}

  const productSitemapCount = Math.max(1, Math.ceil(productCount / PRODUCTS_PER_SITEMAP));
  const now = new Date().toISOString();
  const ids = [{ id: 0, lastModified: now }];
  for (let i = 1; i <= productSitemapCount; i++) ids.push({ id: i, lastModified: now });
  return ids;
}
export async function getSitemapEntries(id) {
  const numericId = typeof id === 'number' ? id : parseInt(id, 10);

  if (numericId === 0) {
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

    let categoryPages = [];
    try {
      const categories = await prisma.category.findMany({
        select: { id: true, slug: true, parentId: true },
      });
      const categoryById = new Map(categories.map(c => [c.id, c]));
      categoryPages = categories.map(cat => {
        let priority = 0.8;
        if (!cat.parentId) priority = 0.9;
        else {
          const parent = categoryById.get(cat.parentId);
          priority = parent && !parent.parentId ? 0.85 : 0.8;
        }
        return {
          url: `${SITE_URL}/category/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority,
        };
      });
    } catch {}

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

    let customPages = [];
    try {
      const setting = await prisma.adminSetting.findUnique({
        where: { key: 'sitemap_urls' },
      });
      if (setting?.value) {
        const rawUrls = setting.value.split('\n').map(l => l.trim()).filter(Boolean);
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

  const batchIndex = numericId - 1;
  if (batchIndex < 0 || isNaN(batchIndex)) return [];

  try {
    const products = await prisma.product.findMany({
      where: { indexable: true },
      select: { partNumber: true, manufacturer: true, updatedAt: true, qualityScore: true },
      orderBy: [{ qualityScore: 'desc' }, { id: 'asc' }],
      skip: batchIndex * PRODUCTS_PER_SITEMAP,
      take: PRODUCTS_PER_SITEMAP,
    });

    return products.map(p => ({
      url: `${SITE_URL}${productPath(p.partNumber, p.manufacturer)}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: p.qualityScore >= 70 ? 'weekly' : 'monthly',
      priority: p.qualityScore >= 70 ? 0.8 : 0.6,
    }));
  } catch {
    return [];
  }
}
