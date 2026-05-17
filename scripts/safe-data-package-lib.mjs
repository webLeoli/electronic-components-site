import { createReadStream } from 'node:fs';
import { mkdir, open, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const PACKAGE_VERSION = 1;

const DEFAULT_TABLES = [
  'categories',
  'manufacturers',
  'products',
  'blogCategories',
  'blogPosts',
  'adminSettings',
];

const TABLE_FILES = {
  categories: 'categories.jsonl',
  manufacturers: 'manufacturers.jsonl',
  products: 'products.jsonl',
  blogCategories: 'blog-categories.jsonl',
  blogPosts: 'blog-posts.jsonl',
  adminSettings: 'admin-settings.jsonl',
};

const DEFAULT_ADMIN_SETTING_KEYS = [
  'robots_txt',
  'sitemap_urls',
  'quality_index_threshold',
  'quality_indexing_disabled',
];

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function parseList(value, fallback = []) {
  if (!value) return [...fallback];
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeTables(value) {
  const requested = parseList(value, DEFAULT_TABLES);
  const expanded = [];

  for (const table of requested) {
    if (table === 'blog') {
      expanded.push('blogCategories', 'blogPosts');
    } else if (table === 'seoSettings') {
      expanded.push('adminSettings');
    } else {
      expanded.push(table);
    }
  }

  const valid = new Set(DEFAULT_TABLES);
  const unique = [...new Set(expanded)];
  const invalid = unique.filter(table => !valid.has(table));
  if (invalid.length) {
    throw new Error(`Unknown table(s): ${invalid.join(', ')}. Valid: ${DEFAULT_TABLES.join(', ')}, blog, seoSettings`);
  }

  return unique;
}

function normalizeAdminSettingKeys(value) {
  const keys = parseList(value, DEFAULT_ADMIN_SETTING_KEYS);
  const allowed = new Set(DEFAULT_ADMIN_SETTING_KEYS);
  const invalid = keys.filter(key => !allowed.has(key));
  if (invalid.length) {
    throw new Error(`AdminSetting key(s) not allowed: ${invalid.join(', ')}. Allowed: ${DEFAULT_ADMIN_SETTING_KEYS.join(', ')}`);
  }
  return [...new Set(keys)];
}

function dateOrNull(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function writeRows(filePath, rows) {
  const fh = await open(filePath, 'w');
  try {
    for (const row of rows) {
      await fh.write(`${JSON.stringify(row)}\n`);
    }
  } finally {
    await fh.close();
  }
  return rows.length;
}

async function writeProductRows(prisma, filePath, batchSize) {
  const fh = await open(filePath, 'w');
  let cursor = 0;
  let written = 0;

  try {
    while (true) {
      const products = await prisma.product.findMany({
        where: { id: { gt: cursor } },
        orderBy: { id: 'asc' },
        take: batchSize,
        select: {
          id: true,
          partNumber: true,
          manufacturer: true,
          description: true,
          datasheet: true,
          packageType: true,
          mountType: true,
          status: true,
          minPrice: true,
          stock: true,
          moq: true,
          leadTime: true,
          specs: true,
          imageUrl: true,
          qualityScore: true,
          indexable: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { slug: true } },
        },
      });

      if (products.length === 0) break;

      for (const product of products) {
        const row = {
          partNumber: product.partNumber,
          manufacturer: product.manufacturer,
          description: product.description,
          categorySlug: product.category?.slug || null,
          datasheet: product.datasheet,
          packageType: product.packageType,
          mountType: product.mountType,
          status: product.status,
          minPrice: product.minPrice,
          stock: product.stock,
          moq: product.moq,
          leadTime: product.leadTime,
          specs: product.specs,
          imageUrl: product.imageUrl,
          qualityScore: product.qualityScore,
          indexable: product.indexable,
          createdAt: dateOrNull(product.createdAt),
          updatedAt: dateOrNull(product.updatedAt),
        };
        await fh.write(`${JSON.stringify(row)}\n`);
      }

      cursor = products[products.length - 1].id;
      written += products.length;
      if (written % 50000 === 0) {
        console.log(`  products exported: ${written.toLocaleString()}`);
      }
    }
  } finally {
    await fh.close();
  }

  return written;
}

async function exportDataPackage(prisma, {
  outputDir,
  tables = DEFAULT_TABLES,
  adminSettingKeys = DEFAULT_ADMIN_SETTING_KEYS,
  batchSize = 5000,
  label = 'fpgacenter-safe-data-package',
} = {}) {
  const outDir = resolve(outputDir || join('data-packages', `fpgacenter-data-${timestamp()}`));
  const selectedTables = normalizeTables(tables.join(','));
  const selectedAdminKeys = normalizeAdminSettingKeys(adminSettingKeys.join(','));

  await mkdir(outDir, { recursive: true });

  const manifest = {
    packageVersion: PACKAGE_VERSION,
    label,
    generatedAt: new Date().toISOString(),
    tables: selectedTables,
    files: {},
    counts: {},
    adminSettingKeys: selectedAdminKeys,
    note: 'Safe data package. Does not include RFQ submissions, contact submissions, admin users, sessions, or environment secrets.',
  };

  if (selectedTables.includes('categories')) {
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        icon: true,
        seoTitle: true,
        seoDesc: true,
        sortOrder: true,
      },
    });
    const byId = new Map(categories.map(category => [category.id, category]));
    const rows = categories.map(category => ({
      name: category.name,
      slug: category.slug,
      parentSlug: category.parentId ? byId.get(category.parentId)?.slug || null : null,
      icon: category.icon,
      seoTitle: category.seoTitle,
      seoDesc: category.seoDesc,
      sortOrder: category.sortOrder,
    }));
    manifest.files.categories = TABLE_FILES.categories;
    manifest.counts.categories = await writeRows(join(outDir, TABLE_FILES.categories), rows);
  }

  if (selectedTables.includes('manufacturers')) {
    const rows = await prisma.manufacturer.findMany({
      orderBy: { name: 'asc' },
      select: {
        name: true,
        slug: true,
        logo: true,
        website: true,
        country: true,
        description: true,
        specialties: true,
        founded: true,
        headquarters: true,
        stockNote: true,
      },
    });
    manifest.files.manufacturers = TABLE_FILES.manufacturers;
    manifest.counts.manufacturers = await writeRows(join(outDir, TABLE_FILES.manufacturers), rows);
  }

  if (selectedTables.includes('blogCategories')) {
    const rows = await prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, slug: true },
    });
    manifest.files.blogCategories = TABLE_FILES.blogCategories;
    manifest.counts.blogCategories = await writeRows(join(outDir, TABLE_FILES.blogCategories), rows);
  }

  if (selectedTables.includes('blogPosts')) {
    const posts = await prisma.blogPost.findMany({
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      select: {
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        status: true,
        publishedAt: true,
        author: true,
        tags: true,
        seoTitle: true,
        seoDesc: true,
        seoKeywords: true,
        relatedProducts: true,
        viewCount: true,
        readingTime: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { slug: true } },
      },
    });
    const rows = posts.map(post => ({
      ...post,
      categorySlug: post.category?.slug || null,
      category: undefined,
      publishedAt: dateOrNull(post.publishedAt),
      createdAt: dateOrNull(post.createdAt),
      updatedAt: dateOrNull(post.updatedAt),
    }));
    manifest.files.blogPosts = TABLE_FILES.blogPosts;
    manifest.counts.blogPosts = await writeRows(join(outDir, TABLE_FILES.blogPosts), rows);
  }

  if (selectedTables.includes('adminSettings')) {
    const rows = await prisma.adminSetting.findMany({
      where: { key: { in: selectedAdminKeys } },
      orderBy: { key: 'asc' },
      select: { key: true, value: true },
    });
    manifest.files.adminSettings = TABLE_FILES.adminSettings;
    manifest.counts.adminSettings = await writeRows(join(outDir, TABLE_FILES.adminSettings), rows);
  }

  if (selectedTables.includes('products')) {
    manifest.files.products = TABLE_FILES.products;
    manifest.counts.products = await writeProductRows(prisma, join(outDir, TABLE_FILES.products), batchSize);
  }

  await writeRows(join(outDir, 'manifest.jsonl'), [manifest]);
  await writeFileJson(join(outDir, 'manifest.json'), manifest);

  return { outputDir: outDir, manifest };
}

async function writeFileJson(filePath, value) {
  const fh = await open(filePath, 'w');
  try {
    await fh.write(`${JSON.stringify(value, null, 2)}\n`);
  } finally {
    await fh.close();
  }
}

async function loadManifest(packageDir) {
  const raw = await readFile(join(resolve(packageDir), 'manifest.json'), 'utf-8');
  const manifest = JSON.parse(raw);
  if (manifest.packageVersion !== PACKAGE_VERSION) {
    throw new Error(`Unsupported package version: ${manifest.packageVersion}`);
  }
  return manifest;
}

async function readJsonl(filePath, onRow) {
  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    if (!line.trim()) continue;
    try {
      await onRow(JSON.parse(line), lineNumber);
    } catch (error) {
      throw new Error(`${filePath}:${lineNumber} ${error.message}`);
    }
  }
}

function packageFile(packageDir, manifest, table) {
  const fileName = manifest.files?.[table] || TABLE_FILES[table];
  if (!fileName) throw new Error(`No package file configured for table: ${table}`);
  return join(resolve(packageDir), fileName);
}

export {
  DEFAULT_ADMIN_SETTING_KEYS,
  DEFAULT_TABLES,
  PACKAGE_VERSION,
  TABLE_FILES,
  dateOrNull,
  exportDataPackage,
  loadManifest,
  normalizeAdminSettingKeys,
  normalizeTables,
  packageFile,
  parseList,
  readJsonl,
  timestamp,
};
