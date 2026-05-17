import prisma from '@/lib/db';
import { productPath, SITE_URL } from '@/lib/seo';

const MAX_URLS_PER_SITEMAP = 50000;
const PRODUCTS_PER_SITEMAP = 5000;
const STATIC_CONTENT_DATE = '2025-04-01T00:00:00.000Z';

const STATIC_PAGES = [
  { path: '', changeFrequency: 'daily', priority: 1.0 },
  { path: '/category', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/manufacturers', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/rfq', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/bom', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/quality', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/shipping', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
];

function toIsoDate(value, fallback = STATIC_CONTENT_DATE) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function normalizeSitemapId(id) {
  return String(id || '').replace(/\.xml$/i, '');
}

function getProductSitemapCount(productCount) {
  return Math.ceil(productCount / PRODUCTS_PER_SITEMAP);
}

export async function generateSitemaps() {
  const [productCount, customCount, categoryLastMod, manufacturerLastMod, blogLastMod, productLastMod] =
    await Promise.all([
      getIndexableProductCount(),
      getCustomUrlCount(),
      getLatestDate('category'),
      getLatestDate('manufacturer'),
      getLatestDate('blog'),
      getLatestDate('product'),
    ]);

  const sitemaps = [
    { id: 'static', lastModified: STATIC_CONTENT_DATE },
    { id: 'categories', lastModified: categoryLastMod },
    { id: 'manufacturers', lastModified: manufacturerLastMod },
    { id: 'blog', lastModified: blogLastMod },
  ];

  if (customCount > 0) {
    sitemaps.push({ id: 'custom', lastModified: STATIC_CONTENT_DATE });
  }

  const productSitemapCount = getProductSitemapCount(productCount);
  for (let i = 1; i <= productSitemapCount; i++) {
    sitemaps.push({ id: `products-${i}`, lastModified: productLastMod });
  }

  return sitemaps;
}

export async function getSitemapEntries(id) {
  const normalizedId = normalizeSitemapId(id);

  switch (normalizedId) {
    case 'static':
      return getStaticPages();
    case 'categories':
      return getCategoryPages();
    case 'manufacturers':
      return getManufacturerPages();
    case 'blog':
      return getBlogPages();
    case 'custom':
      return getCustomPages();
    default: {
      const match = normalizedId.match(/^products-(\d+)$/);
      if (!match) return [];

      const batchIndex = Number.parseInt(match[1], 10) - 1;
      return getProductPages(batchIndex);
    }
  }
}

export async function getSitemapSummary() {
  const [totalProducts, indexableProducts, customUrlCount] = await Promise.all([
    safeProductCount({}),
    getIndexableProductCount(),
    getCustomUrlCount(),
  ]);
  const productSitemaps = getProductSitemapCount(indexableProducts);

  return {
    totalProducts,
    indexableProducts,
    excludedProducts: Math.max(0, totalProducts - indexableProducts),
    productsPerSitemap: PRODUCTS_PER_SITEMAP,
    maxUrlsPerSitemap: MAX_URLS_PER_SITEMAP,
    productSitemaps,
    staticSitemaps: 4 + (customUrlCount > 0 ? 1 : 0),
    customUrlCount,
    totalSitemaps: 4 + (customUrlCount > 0 ? 1 : 0) + productSitemaps,
  };
}

function getStaticPages() {
  return STATIC_PAGES.map(page => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: STATIC_CONTENT_DATE,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

async function getCategoryPages() {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true, parentId: true },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    const categoryDates = await getCategoryLastModDates();
    const categoryById = new Map(categories.map(category => [category.id, category]));

    return categories.map(category => {
      let priority = 0.8;
      if (!category.parentId) {
        priority = 0.9;
      } else {
        const parent = categoryById.get(category.parentId);
        priority = parent && !parent.parentId ? 0.85 : 0.8;
      }

      return {
        url: `${SITE_URL}/category/${category.slug}`,
        lastModified: categoryDates.get(category.id) || STATIC_CONTENT_DATE,
        changeFrequency: 'weekly',
        priority,
      };
    });
  } catch {
    return [];
  }
}

async function getManufacturerPages() {
  try {
    const manufacturers = await prisma.manufacturer.findMany({
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    });
    const manufacturerDates = await getManufacturerLastModDates();

    return manufacturers.map(manufacturer => ({
      url: `${SITE_URL}/manufacturer/${manufacturer.slug}`,
      lastModified: manufacturerDates.get(manufacturer.name) || STATIC_CONTENT_DATE,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

async function getBlogPages() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });

    return posts.map(post => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: toIsoDate(post.updatedAt || post.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

async function getCustomPages() {
  const paths = await getCustomUrlPaths();

  return paths.map(path => ({
    url: path.startsWith('http') ? path : `${SITE_URL}${path}`,
    lastModified: STATIC_CONTENT_DATE,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));
}

async function getProductPages(batchIndex) {
  if (!Number.isInteger(batchIndex) || batchIndex < 0) return [];

  try {
    const products = await prisma.product.findMany({
      where: { indexable: true },
      select: {
        partNumber: true,
        manufacturer: true,
        updatedAt: true,
        qualityScore: true,
      },
      orderBy: { id: 'asc' },
      skip: batchIndex * PRODUCTS_PER_SITEMAP,
      take: PRODUCTS_PER_SITEMAP,
    });

    return products.map(product => ({
      url: `${SITE_URL}${productPath(product.partNumber, product.manufacturer)}`,
      lastModified: toIsoDate(product.updatedAt),
      changeFrequency: product.qualityScore >= 70 ? 'weekly' : 'monthly',
      priority: product.qualityScore >= 70 ? 0.8 : 0.6,
    }));
  } catch {
    return [];
  }
}

async function getIndexableProductCount() {
  return safeProductCount({ indexable: true });
}

async function safeProductCount(where) {
  try {
    return await prisma.product.count({ where });
  } catch {
    return 0;
  }
}

async function getCustomUrlCount() {
  const paths = await getCustomUrlPaths();
  return paths.length;
}

async function getCustomUrlPaths() {
  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'sitemap_urls' },
      select: { value: true },
    });

    return parseCustomUrlPaths(setting?.value || '');
  } catch {
    return [];
  }
}

function parseCustomUrlPaths(value) {
  const seen = new Set();
  const siteOrigin = new URL(SITE_URL).origin;

  return String(value)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      if (line.startsWith('http://') || line.startsWith('https://')) {
        try {
          const url = new URL(line);
          return url.origin === siteOrigin ? url.toString() : '';
        } catch {
          return '';
        }
      }

      return line.startsWith('/') ? line : '';
    })
    .filter(path => {
      if (!path || seen.has(path)) return false;
      seen.add(path);
      return true;
    });
}

async function getLatestDate(type) {
  try {
    switch (type) {
      case 'product': {
        const latest = await prisma.product.findFirst({
          where: { indexable: true },
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true },
        });
        return toIsoDate(latest?.updatedAt);
      }
      case 'category': {
        const latest = await prisma.product.findFirst({
          where: { indexable: true, categoryId: { not: null } },
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true },
        });
        return toIsoDate(latest?.updatedAt);
      }
      case 'manufacturer': {
        const latest = await prisma.product.findFirst({
          where: { indexable: true },
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true },
        });
        return toIsoDate(latest?.updatedAt);
      }
      case 'blog': {
        const latest = await prisma.blogPost.findFirst({
          where: { status: 'published' },
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true },
        });
        return toIsoDate(latest?.updatedAt);
      }
      default:
        return STATIC_CONTENT_DATE;
    }
  } catch {
    return STATIC_CONTENT_DATE;
  }
}

async function getCategoryLastModDates() {
  const dates = new Map();

  try {
    const results = await prisma.$queryRaw`
      SELECT "categoryId", MAX("updatedAt") as "lastModified"
      FROM "Product"
      WHERE "indexable" = true AND "categoryId" IS NOT NULL
      GROUP BY "categoryId"
    `;

    for (const row of results) {
      dates.set(row.categoryId, toIsoDate(row.lastModified));
    }
  } catch {}

  return dates;
}

async function getManufacturerLastModDates() {
  const dates = new Map();

  try {
    const results = await prisma.$queryRaw`
      SELECT "manufacturer", MAX("updatedAt") as "lastModified"
      FROM "Product"
      WHERE "indexable" = true AND "manufacturer" IS NOT NULL AND "manufacturer" != ''
      GROUP BY "manufacturer"
    `;

    for (const row of results) {
      dates.set(row.manufacturer, toIsoDate(row.lastModified));
    }
  } catch {}

  return dates;
}

export {
  MAX_URLS_PER_SITEMAP,
  PRODUCTS_PER_SITEMAP,
  STATIC_CONTENT_DATE,
  normalizeSitemapId,
};
