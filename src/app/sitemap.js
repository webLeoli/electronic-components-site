import prisma from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

export default async function sitemap() {
  // Static pages
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/category`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/manufacturers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
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

  // Dynamic: Categories
  let categoryPages = [];
  try {
    const categories = await prisma.category.findMany({
      select: { slug: true },
    });
    categoryPages = categories.map(cat => ({
      url: `${SITE_URL}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
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

  // Dynamic: Products (limit to 45000 per sitemap file to stay under 50K limit)
  let productPages = [];
  try {
    const products = await prisma.product.findMany({
      select: { partNumber: true, updatedAt: true },
      take: 45000,
      orderBy: { updatedAt: 'desc' },
    });
    productPages = products.map(p => ({
      url: `${SITE_URL}/product/${encodeURIComponent(p.partNumber)}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch {}

  // Dynamic: Blog Posts
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
      // split by newline, trim, remove empty, prepend SITE_URL if needed
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
    ...productPages,
    ...blogPages,
    ...customPages,
  ];
}
