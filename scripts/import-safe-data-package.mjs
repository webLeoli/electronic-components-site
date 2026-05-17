#!/usr/bin/env node
/**
 * Import a safe data package.
 *
 * Default mode is validation only. Add --apply to write to the database.
 * This script never imports RFQ submissions, contact submissions, admin users,
 * sessions, env secrets, or build artifacts.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_ADMIN_SETTING_KEYS,
  exportDataPackage,
  loadManifest,
  normalizeAdminSettingKeys,
  normalizeTables,
  packageFile,
  readJsonl,
  timestamp,
} from './safe-data-package-lib.mjs';

const prisma = new PrismaClient();

function parseArgs() {
  const opts = {
    packageDir: null,
    apply: false,
    noBackup: false,
    tables: null,
    adminSettingKeys: DEFAULT_ADMIN_SETTING_KEYS,
    batchSize: 200,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, value = ''] = arg.slice(2).split('=');
      switch (key) {
        case 'apply':
          opts.apply = true;
          break;
        case 'no-backup':
          opts.noBackup = true;
          break;
        case 'tables':
          opts.tables = normalizeTables(value);
          break;
        case 'admin-setting-keys':
          opts.adminSettingKeys = normalizeAdminSettingKeys(value);
          break;
        case 'batch-size':
          opts.batchSize = Math.max(10, Math.min(1000, Number.parseInt(value, 10) || 200));
          break;
        default:
          throw new Error(`Unknown option: --${key}`);
      }
    } else if (!opts.packageDir) {
      opts.packageDir = arg;
    }
  }

  if (!opts.packageDir) {
    throw new Error('Usage: node scripts/import-safe-data-package.mjs <package-dir> [--apply] [--tables=products,categories]');
  }

  return opts;
}

function parseDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function loadCategoryMap() {
  const rows = await prisma.category.findMany({ select: { id: true, slug: true } });
  return new Map(rows.map(row => [row.slug, row.id]));
}

async function loadBlogCategoryMap() {
  const rows = await prisma.blogCategory.findMany({ select: { id: true, slug: true } });
  return new Map(rows.map(row => [row.slug, row.id]));
}

async function importCategories(packageDir, manifest, apply) {
  const file = packageFile(packageDir, manifest, 'categories');
  if (!existsSync(file)) return { read: 0, written: 0 };

  const rows = [];
  await readJsonl(file, async row => rows.push(row));
  if (!apply) return { read: rows.length, written: 0 };

  const bySlug = new Map();
  let written = 0;
  let pending = [...rows];

  for (let pass = 0; pass < 8 && pending.length > 0; pass++) {
    const next = [];

    for (const row of pending) {
      const parentId = row.parentSlug ? bySlug.get(row.parentSlug) : null;
      if (row.parentSlug && !parentId) {
        next.push(row);
        continue;
      }

      const category = await prisma.category.upsert({
        where: { slug: row.slug },
        create: {
          name: row.name,
          slug: row.slug,
          parentId,
          icon: row.icon ?? null,
          seoTitle: row.seoTitle ?? null,
          seoDesc: row.seoDesc ?? null,
          sortOrder: row.sortOrder ?? 0,
        },
        update: {
          name: row.name,
          parentId,
          icon: row.icon ?? null,
          seoTitle: row.seoTitle ?? null,
          seoDesc: row.seoDesc ?? null,
          sortOrder: row.sortOrder ?? 0,
        },
        select: { id: true, slug: true },
      });
      bySlug.set(category.slug, category.id);
      written++;
    }

    pending = next;
  }

  if (pending.length) {
    throw new Error(`Could not import ${pending.length} categories because parentSlug was missing`);
  }

  return { read: rows.length, written };
}

async function importManufacturers(packageDir, manifest, apply) {
  const file = packageFile(packageDir, manifest, 'manufacturers');
  if (!existsSync(file)) return { read: 0, written: 0 };

  let read = 0;
  let written = 0;

  await readJsonl(file, async row => {
    read++;
    if (!apply) return;

    const data = {
      name: row.name,
      slug: row.slug,
      logo: row.logo ?? null,
      website: row.website ?? null,
      country: row.country ?? null,
      description: row.description ?? null,
      specialties: row.specialties ?? null,
      founded: row.founded ?? null,
      headquarters: row.headquarters ?? null,
      stockNote: row.stockNote ?? null,
    };

    const matches = await prisma.manufacturer.findMany({
      where: { OR: [{ slug: row.slug }, { name: row.name }] },
      select: { id: true, name: true, slug: true },
    });
    const ids = new Set(matches.map(match => match.id));
    if (ids.size > 1) {
      throw new Error(`Manufacturer conflict for "${row.name}" / "${row.slug}". Existing rows use the same name and slug separately.`);
    }

    if (matches.length) {
      await prisma.manufacturer.update({
        where: { id: matches[0].id },
        data,
      });
    } else {
      await prisma.manufacturer.create({ data });
    }
    written++;
  });

  return { read, written };
}

async function importBlogCategories(packageDir, manifest, apply) {
  const file = packageFile(packageDir, manifest, 'blogCategories');
  if (!existsSync(file)) return { read: 0, written: 0 };

  let read = 0;
  let written = 0;

  await readJsonl(file, async row => {
    read++;
    if (!apply) return;
    await prisma.blogCategory.upsert({
      where: { slug: row.slug },
      create: { name: row.name, slug: row.slug },
      update: { name: row.name },
    });
    written++;
  });

  return { read, written };
}

async function importBlogPosts(packageDir, manifest, apply) {
  const file = packageFile(packageDir, manifest, 'blogPosts');
  if (!existsSync(file)) return { read: 0, written: 0 };

  const categoryMap = apply ? await loadBlogCategoryMap() : new Map();
  let read = 0;
  let written = 0;

  await readJsonl(file, async row => {
    read++;
    if (!apply) return;

    const categoryId = row.categorySlug ? categoryMap.get(row.categorySlug) ?? null : null;
    const data = {
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt ?? null,
      content: row.content,
      coverImage: row.coverImage ?? null,
      status: row.status || 'draft',
      publishedAt: parseDate(row.publishedAt) ?? null,
      author: row.author || 'FPGACenter Team',
      categoryId,
      tags: row.tags ?? null,
      seoTitle: row.seoTitle ?? null,
      seoDesc: row.seoDesc ?? null,
      seoKeywords: row.seoKeywords ?? null,
      relatedProducts: row.relatedProducts ?? null,
      viewCount: Number.isFinite(row.viewCount) ? row.viewCount : 0,
      readingTime: row.readingTime ?? null,
      createdAt: parseDate(row.createdAt),
      updatedAt: parseDate(row.updatedAt),
    };

    await prisma.blogPost.upsert({
      where: { slug: row.slug },
      create: data,
      update: data,
    });
    written++;
  });

  return { read, written };
}

async function importAdminSettings(packageDir, manifest, apply, allowedKeys) {
  const file = packageFile(packageDir, manifest, 'adminSettings');
  if (!existsSync(file)) return { read: 0, written: 0 };

  const allowed = new Set(allowedKeys);
  let read = 0;
  let written = 0;

  await readJsonl(file, async row => {
    read++;
    if (!allowed.has(row.key)) return;
    if (!apply) return;

    await prisma.adminSetting.upsert({
      where: { key: row.key },
      create: { key: row.key, value: String(row.value ?? '') },
      update: { value: String(row.value ?? '') },
    });
    written++;
  });

  return { read, written };
}

function productData(row, categoryMap) {
  const categoryId = row.categorySlug ? categoryMap.get(row.categorySlug) ?? null : null;
  return {
    manufacturer: row.manufacturer || 'Unknown',
    description: row.description ?? null,
    categoryId,
    datasheet: row.datasheet ?? null,
    packageType: row.packageType ?? null,
    mountType: row.mountType ?? null,
    status: row.status || 'active',
    minPrice: row.minPrice ?? null,
    stock: Number.isFinite(row.stock) ? row.stock : 0,
    moq: Number.isFinite(row.moq) ? row.moq : 1,
    leadTime: row.leadTime ?? null,
    specs: row.specs ?? null,
    imageUrl: row.imageUrl ?? null,
    qualityScore: Number.isFinite(row.qualityScore) ? row.qualityScore : 0,
    indexable: !!row.indexable,
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  };
}

async function importProducts(packageDir, manifest, apply, batchSize) {
  const file = packageFile(packageDir, manifest, 'products');
  if (!existsSync(file)) return { read: 0, written: 0 };

  const categoryMap = apply ? await loadCategoryMap() : new Map();
  let read = 0;
  let written = 0;
  let skipped = 0;
  let batch = [];

  async function flush() {
    if (batch.length === 0) return;
    const current = batch;
    batch = [];

    if (!apply) {
      written += current.length;
      return;
    }

    const ops = current.map(row => {
      const data = productData(row, categoryMap);
      return prisma.product.upsert({
        where: { partNumber: row.partNumber },
        create: {
          partNumber: row.partNumber,
          ...data,
        },
        update: data,
      });
    });

    await prisma.$transaction(ops, { timeout: 120000 });
    written += current.length;

    if (written % 50000 === 0) {
      console.log(`  products imported: ${written.toLocaleString()}`);
    }
  }

  await readJsonl(file, async row => {
    read++;
    if (!row.partNumber || !row.manufacturer) {
      skipped++;
      return;
    }
    batch.push(row);
    if (batch.length >= batchSize) await flush();
  });

  await flush();
  return { read, written, skipped };
}

async function main() {
  const opts = parseArgs();
  const packageDir = resolve(opts.packageDir);
  const manifest = await loadManifest(packageDir);
  const tables = opts.tables || manifest.tables || [];

  console.log('Safe data import');
  console.log(`  package: ${packageDir}`);
  console.log(`  mode: ${opts.apply ? 'APPLY' : 'validate only'}`);
  console.log(`  tables: ${tables.join(', ')}`);
  console.log('');

  if (!opts.apply) {
    console.log('No database writes will be made. Add --apply to import.');
  } else if (!opts.noBackup) {
    const backupDir = `backups/safe-data-before-import-${timestamp()}`;
    console.log(`Creating backup first: ${backupDir}`);
    await exportDataPackage(prisma, {
      outputDir: backupDir,
      tables,
      adminSettingKeys: opts.adminSettingKeys,
      batchSize: 5000,
      label: 'backup-before-safe-data-import',
    });
    console.log('Backup complete.');
  }

  const summary = {};

  if (tables.includes('categories')) {
    summary.categories = await importCategories(packageDir, manifest, opts.apply);
  }
  if (tables.includes('manufacturers')) {
    summary.manufacturers = await importManufacturers(packageDir, manifest, opts.apply);
  }
  if (tables.includes('blogCategories')) {
    summary.blogCategories = await importBlogCategories(packageDir, manifest, opts.apply);
  }
  if (tables.includes('blogPosts')) {
    summary.blogPosts = await importBlogPosts(packageDir, manifest, opts.apply);
  }
  if (tables.includes('adminSettings')) {
    summary.adminSettings = await importAdminSettings(packageDir, manifest, opts.apply, opts.adminSettingKeys);
  }
  if (tables.includes('products')) {
    summary.products = await importProducts(packageDir, manifest, opts.apply, opts.batchSize);
  }

  console.log('');
  console.log(opts.apply ? 'Import complete.' : 'Validation complete.');
  for (const [table, result] of Object.entries(summary)) {
    console.log(`  ${table}: read=${result.read.toLocaleString()} written=${result.written.toLocaleString()}${result.skipped ? ` skipped=${result.skipped.toLocaleString()}` : ''}`);
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
