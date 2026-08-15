import prisma from '@/lib/db';
import { productPath, SITE_URL } from '@/lib/seo';
import { TIERS } from '@/lib/quality-score';
import { getFpgaSeries } from '@/lib/fpga-growth';
import { getLiveSubsystems } from '@/lib/robotics-growth';

const MAX_URLS_PER_SITEMAP = 50000;
const PRODUCTS_PER_SITEMAP = 5000;
// Bump this whenever static-page content meaningfully changes (new pages added,
// sitewide nav/layout changes). A stale value makes new URLs enter the sitemap
// with a lastmod predating their existence, which teaches crawlers to distrust
// the field sitewide.
const STATIC_CONTENT_DATE = '2026-07-26T00:00:00.000Z';

const STATIC_PAGES = [
  { path: '', changeFrequency: 'daily', priority: 1.0 },
  { path: '/category', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/fpga-sourcing', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/robotics-sourcing', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/manufacturers', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/rfq', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/bom', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/tools', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/tools/fpga-part-number-decoder', changeFrequency: 'monthly', priority: 0.7 },
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
  const fpgaSeriesPages = getFpgaSeries().map(series => ({
    path: `/fpga-sourcing/${series.slug}`,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));
  const roboticsSubsystemPages = getLiveSubsystems().map(subsystem => ({
    path: `/robotics-sourcing/${subsystem.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...STATIC_PAGES, ...fpgaSeriesPages, ...roboticsSubsystemPages].map(page => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: STATIC_CONTENT_DATE,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

async function getCategoryPages() {
  try {
    const allCategories = await prisma.category.findMany({
      select: { id: true, slug: true, parentId: true },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Drop leaf categories that hold no products. Such a page renders nothing
    // but an empty state, and submitting it invites Google to classify the
    // sitemap as padded with thin URLs. Branch categories stay: they aggregate
    // their descendants' products even with no direct rows of their own.
    const parentIds = new Set(allCategories.map(c => c.parentId).filter(Boolean));
    const withProducts = new Set(
      (await prisma.$queryRaw`
        SELECT DISTINCT "categoryId" FROM "Product" WHERE "categoryId" IS NOT NULL AND "duplicateOfId" IS NULL
      `).map(row => row.categoryId),
    );
    const categories = allCategories.filter(
      c => withProducts.has(c.id) || parentIds.has(c.id),
    );

    const categoryDates = await getCategoryLastModDates();
    const categoryById = new Map(allCategories.map(category => [category.id, category]));

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
    // Only brands that actually have products. Every Manufacturer row used to
    // ship here, including 35 that held none — their pages rendered "0 products"
    // and were submitted to Google as crawlable content. The product-count
    // aggregate is already computed for lastmod below, so the filter is free.
    const [manufacturers, manufacturerDates] = await Promise.all([
      prisma.manufacturer.findMany({
        select: { slug: true, name: true },
        orderBy: { name: 'asc' },
      }),
      getManufacturerLastModDates(),
    ]);
    // duplicateOfId IS NULL matches the manufacturer page's own 404 rule
    // (manufacturer/[slug]/page.js counts listable rows only) — without it a
    // brand whose rows are all consolidated duplicates is submitted, then 404s.
    const withProducts = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT "manufacturer" FROM "Product" WHERE "duplicateOfId" IS NULL`
    );
    const populated = new Set(withProducts.map(row => row.manufacturer));

    return manufacturers.filter(m => populated.has(m.name)).map(manufacturer => ({
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
    const offset = batchIndex * PRODUCTS_PER_SITEMAP;
    let startId = null;

    // A deep OFFSET on the full sitemap projection makes Postgres scan and
    // sort the entire 700K-row catalogue for every late shard. Resolve only
    // the boundary id first: Product_indexable_id_idx makes this an index-only
    // scan, then the actual 5K-row page is a small forward index scan.
    if (offset > 0) {
      const boundary = await prisma.product.findFirst({
        where: { indexable: true },
        select: { id: true },
        orderBy: { id: 'asc' },
        skip: offset,
      });
      if (!boundary) return [];
      startId = boundary.id;
    }

    const products = await prisma.product.findMany({
      where: {
        indexable: true,
        ...(startId == null ? {} : { id: { gte: startId } }),
      },
      select: {
        partNumber: true,
        manufacturer: true,
        contentUpdatedAt: true,
        qualityScore: true,
      },
      orderBy: { id: 'asc' },
      take: PRODUCTS_PER_SITEMAP,
    });

    return products.map(product => ({
      url: `${SITE_URL}${productPath(product.partNumber, product.manufacturer)}`,
      lastModified: toIsoDate(product.contentUpdatedAt),
      // Gold-tier pages get the higher crawl hint. Reads the tier definition
      // rather than a literal 70, which silently became "almost nothing"
      // when the scoring scale was reweighted.
      changeFrequency: product.qualityScore >= TIERS.gold.min ? 'weekly' : 'monthly',
      priority: product.qualityScore >= TIERS.gold.min ? 0.8 : 0.6,
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
      // All three product-derived cases read contentUpdatedAt, not updatedAt:
      // a housekeeping rescore must not advance any sitemap's lastmod.
      case 'product': {
        const latest = await prisma.product.findFirst({
          where: { indexable: true },
          orderBy: { contentUpdatedAt: 'desc' },
          select: { contentUpdatedAt: true },
        });
        return toIsoDate(latest?.contentUpdatedAt);
      }
      case 'category': {
        const latest = await prisma.product.findFirst({
          where: { indexable: true, categoryId: { not: null } },
          orderBy: { contentUpdatedAt: 'desc' },
          select: { contentUpdatedAt: true },
        });
        return toIsoDate(latest?.contentUpdatedAt);
      }
      case 'manufacturer': {
        const latest = await prisma.product.findFirst({
          where: { indexable: true },
          orderBy: { contentUpdatedAt: 'desc' },
          select: { contentUpdatedAt: true },
        });
        return toIsoDate(latest?.contentUpdatedAt);
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
      SELECT "categoryId", MAX("contentUpdatedAt") as "lastModified"
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
      SELECT "manufacturer", MAX("contentUpdatedAt") as "lastModified"
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
